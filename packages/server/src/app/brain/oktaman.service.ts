import { AgentSessionStatus, AgentStreamingEvent, AgentStreamingUpdate, AgentStreamingUpdateProgressData, AssistantConversationContent, ConversationMessage, isNil, Session, mutexLock, splitTextWithImages } from "@oktaman/shared";
import { LanguageModelUsage, ModelMessage, ReasoningOutput, TextPart, ToolCallPart, ToolLoopAgent, ToolResultPart } from "ai";
import { inspect } from "util";
import { buildMainSystemPrompt } from "./system-prompt";
import { compactionService } from "./compaction";
import { logger } from "../common/logger";
import { agentService } from "../agent/agent.service";
import { sandboxManager } from "./sandbox-manager";
import { sessionStatusAgent } from "./post-hooks/session-status-agent";
import { sessionStreamHandler } from "./session-stream-handler";
import { settingsService } from "../settings/settings.service";
import { createStopCondition } from "./stop-condition";
import { constructTools } from "./tool-constructor";
import { createModel, getProviderOptions, extractCost } from "../settings/providers";

export const oktamanService = {
    chatWithOktaMan: async (session: Session, abortSignal?: AbortSignal, onMessage?: (parts: AssistantConversationContent[]) => void) => {
        return mutexLock.runExclusive(session.id, async () => {
            return executeChatWithOktaMan(session, abortSignal, onMessage);
        });
    }
};

async function executeChatWithOktaMan(session: Session, abortSignal?: AbortSignal, onMessage?: (parts: AssistantConversationContent[]) => void) {

    const sandbox = await sandboxManager.getOrCreate(session.id);

    if (abortSignal?.aborted) {
        throw new Error('Session was stopped before starting');
    }

    try {
        const providerConfig = await settingsService.getProviderConfig();

        if (!providerConfig) {
            throw new Error('AI provider not configured. Please configure it in Settings.');
        }

        if (providerConfig.type !== 'ollama' && !providerConfig.apiKey) {
            throw new Error(`API key not configured for ${providerConfig.type}. Please configure it in Settings.`);
        }

        const model = createModel(providerConfig, session.modelId);

        let lastStepUsage: LanguageModelUsage | undefined;
        const agentContext = !isNil(session.agentId) ? await agentService.getOne({ id: session.agentId }) : undefined;

        // Construct all tools based on session source
        const { tools, excludedTools } = await constructTools({
            sandbox,
            sessionId: session.id,
            sessionSource: session.source,
        });

        const sessionUpdate: AgentStreamingUpdate = {
            event: AgentStreamingEvent.AGENT_SESSION_UPDATE as const,
            data: {
                sessionId: session.id,
                status: AgentSessionStatus.RUNNING,
            },
        };
        session = await sessionStreamHandler.handleUpdate({ update: sessionUpdate, session });

        const stopCondition = createStopCondition({ session });

        const systemPrompt = await buildMainSystemPrompt({ agentContext: agentContext ?? undefined, session, excludedTools });

        const assistant = new ToolLoopAgent({
            model,
            onStepFinish: async (content) => {
                lastStepUsage = content.usage;
                if (content.text.length > 0) {
                    const parts = splitTextWithImages(content.text);
                    if (parts.length > 0) {
                        onMessage?.(parts);
                    }
                }
            },
            providerOptions: getProviderOptions(providerConfig),
            prepareStep: async ({ messages }) => {
                const compactNeeded = !isNil(lastStepUsage) && compactionService.needsCompaction(lastStepUsage, session.modelId);
                if (compactNeeded) {
                    logger.info({
                        usage: lastStepUsage,
                        messages: messages.length,
                    }, '[OktaManService] Compacting messages')
                    const compactionUpdate: AgentStreamingUpdate = {
                        event: AgentStreamingEvent.AGENT_COMPACTION as const,
                        data: {
                            sessionId: session.id,
                            compaction: compactionService.compact(messages),
                        },
                    }

                    session = await sessionStreamHandler.handleUpdate({ update: compactionUpdate, session });

                    return {
                        messages: convertHistory(session.conversation),
                    };
                }
                return { messages };
            },
            instructions: systemPrompt,
            tools,
            stopWhen: stopCondition,
        });
        const result = await assistant.stream({
            messages: convertHistory(session.conversation),
            abortSignal,
        });
        for await (const chunk of result.fullStream) {
            switch (chunk.type) {
                case 'text-delta': {
                    session = await sessionStreamHandler.handleUpdate({
                        update: {
                            event: AgentStreamingEvent.AGENT_STREAMING_UPDATE as const,
                            data: {
                                sessionId: session.id,
                                part: {
                                    type: 'text-delta',
                                    message: chunk.text,
                                    startedAt: new Date().toISOString(),
                                },
                            },
                        },
                        session,
                    });
                    break
                }
                case 'reasoning-delta': {
                    if (providerConfig.type === 'openrouter') {
                        const reasoningDetails = (chunk.providerMetadata as Record<string, Record<string, unknown[]>>)?.openrouter?.['reasoning_details']?.[0] as ReasoningDetail | undefined;

                        if (reasoningDetails?.type === 'reasoning.summary' || reasoningDetails?.type === 'reasoning.text') {
                            const update: AgentStreamingUpdate = {
                                event: AgentStreamingEvent.AGENT_STREAMING_UPDATE as const,
                                data: {
                                    sessionId: session.id,
                                    part: {
                                        type: 'thinking-delta',
                                        message: reasoningDetails?.text,
                                        startedAt: new Date().toISOString(),
                                    },
                                },
                            };
                            session = await sessionStreamHandler.handleUpdate({ update, session });
                        }
                    }
                    break
                }
                case 'tool-input-start': {
                    const update: AgentStreamingUpdate = {
                        event: AgentStreamingEvent.AGENT_STREAMING_UPDATE as const,
                        data: publishToolCallUpdate({
                            sessionId: session.id,
                            toolCallId: chunk.id,
                            toolName: chunk.toolName,
                            input: undefined,
                            output: undefined,
                            status: 'loading',
                            startedAt: new Date().toISOString(),
                        }),
                    };
                    session = await sessionStreamHandler.handleUpdate({ update, session });
                    break
                }
                case 'tool-call': {
                    const toolCallInput = typeof chunk.input === 'object' && chunk.input !== null
                        ? chunk.input as Record<string, unknown>
                        : undefined;

                    const update: AgentStreamingUpdate = {
                        event: AgentStreamingEvent.AGENT_STREAMING_UPDATE as const,
                        data: publishToolCallUpdate({
                            sessionId: session.id,
                            toolCallId: chunk.toolCallId,
                            toolName: chunk.toolName,
                            input: toolCallInput,
                            output: undefined,
                            status: 'ready',
                        }),
                    };
                    session = await sessionStreamHandler.handleUpdate({ update, session });
                    break
                }
                case 'tool-error': {
                    const toolErrorInput = typeof chunk.input === 'object' && chunk.input !== null
                        ? chunk.input as Record<string, unknown>
                        : undefined;

                    const errorMessage = inspect(chunk.error)
                    const update: AgentStreamingUpdate = {
                        event: AgentStreamingEvent.AGENT_STREAMING_UPDATE as const,
                        data: publishToolCallUpdate({
                            sessionId: session.id,
                            toolCallId: chunk.toolCallId,
                            toolName: chunk.toolName,
                            input: toolErrorInput,
                            output: undefined,
                            status: 'error',
                            error: errorMessage,
                        }),
                    };
                    session = await sessionStreamHandler.handleUpdate({ update, session });
                    break
                }
                case 'tool-result': {
                    const toolInput = typeof chunk.input === 'object' && chunk.input !== null
                        ? chunk.input as Record<string, unknown>
                        : undefined;

                    const toolOutput = typeof chunk.output === 'object' && chunk.output !== null
                        ? chunk.output as Record<string, unknown>
                        : undefined;

                    // Handle the update (emits to socket and persists to DB)
                    session = await sessionStreamHandler.handleUpdate({
                        update: {
                            event: AgentStreamingEvent.AGENT_STREAMING_UPDATE as const,
                            data: publishToolCallUpdate({
                                sessionId: session.id,
                                toolCallId: chunk.toolCallId,
                                toolName: chunk.toolName,
                                input: toolInput,
                                output: toolOutput,
                                status: 'completed',
                                completedAt: new Date().toISOString(),
                            })
                        }, session
                    });

                    break;
                }
                default: {
                    break
                }
            }
        }

        const usage = await result.usage;
        const providerMetadata = await result.providerMetadata;
        const iterationCost = extractCost(providerConfig.type, providerMetadata);

        // Send cost update to update the last assistant message
        if (iterationCost > 0) {
            const costUpdate: AgentStreamingUpdate = {
                event: AgentStreamingEvent.AGENT_STREAMING_UPDATE as const,
                data: {
                    sessionId: session.id,
                    cost: iterationCost,
                },
            };
            session = await sessionStreamHandler.handleUpdate({ update: costUpdate, session });
        }

        const updatedCost = session.cost + iterationCost;

        const finalSessionUpdate: AgentStreamingUpdate = {
            event: AgentStreamingEvent.AGENT_SESSION_UPDATE as const,
            data: {
                sessionId: session.id,
                status: await sessionStatusAgent.determineStatus(session.source, providerConfig, session.conversation),
                isStreaming: false,
                usage: usage,
                cost: updatedCost,
            },
        };
        session = await sessionStreamHandler.handleUpdate({ update: finalSessionUpdate, session });
        logger.info({
            sessionId: session.id,
            currentCost: session.cost,
            iterationCost: iterationCost,
            cost: updatedCost,
        }, '[OktaManService] Updating session cost');

        return usage;
    } catch (error) {
        logger.error({
            sessionId: session.id,
            error: error instanceof Error ? error.message : String(error),
        }, '[OktaManService] Error streaming with OktaMan');
        // Send session closed update
        await sessionStreamHandler.handleUpdate({
            session,
            update: {
                event: AgentStreamingEvent.AGENT_SESSION_UPDATE,
                data: {
                    sessionId: session.id,
                    status: AgentSessionStatus.CLOSED,
                    isStreaming: false,
                },
            },
        });
        throw error;
    } finally {
        logger.info('[OktaManService] Session completed');
    }
}


function publishToolCallUpdate(params: PublishToolCall) {
    const { sessionId, toolCallId, toolName, input, output, status, error, startedAt, completedAt } = params

    const oktamanStreamingUpdate: AgentStreamingUpdateProgressData = {
        sessionId: sessionId,
        part: {
            type: 'tool-call',
            toolCallId,
            toolName,
            input,
            output,
            status,
            error,
            startedAt,
            completedAt,
        },
    }
    return oktamanStreamingUpdate
}




function convertHistory(conversation: ConversationMessage[]): ModelMessage[] {
    let history: ModelMessage[] = []

    for (const message of conversation) {
        switch (message.role) {
            case 'user': {
                const userContent = message.content.map(part => {
                    switch (part.type) {
                        case 'text':
                            return {
                                type: 'text' as const,
                                text: part.message + ' (sentAt: ' + message.sentAt + ')',
                            }
                        case 'image':
                            return {
                                type: 'image' as const,
                                image: part.image,
                            }
                        case 'file':
                            return {
                                type: 'file' as const,
                                data: part.file,
                                mediaType: part.mimeType ?? 'application/octet-stream',
                            }
                        case 'instructions':
                            return {
                                type: 'text' as const,
                                text: 'Automation instructions: ' + part.instructions,
                            }
                        case 'trigger-payload':
                            return {
                                type: 'text' as const,
                                text: `Trigger Data:\n${JSON.stringify(part.payload, null, 2)}`,
                            }
                        default:
                            return undefined
                    }
                }).filter(f => f !== undefined)

                if (userContent.length > 0) {
                    history.push({
                        role: 'user',
                        content: userContent,
                    } as ModelMessage)
                }
                break
            }
            case 'assistant': {
                // Process assistant message parts
                const toolResults: ToolResultPart[] = []
                const toolCalls: ToolCallPart[] = []
                const textParts: (TextPart | ReasoningOutput)[] = []

                for (const item of message.parts) {
                    switch (item.type) {
                        case 'text':
                            if (item.message && item.message.trim().length > 0) {
                                const textPart: TextPart = {
                                    type: 'text' as const,
                                    text: item.message,
                                }
                                textParts.push(textPart)
                            }
                            break
                        case 'thinking':
                            if (item.message && item.message.trim().length > 0) {
                                const textPart = {
                                    type: 'reasoning' as const,
                                    text: item.message,
                                }
                                textParts.push(textPart)
                            }
                            break
                        case 'assistant-attachment': {
                            const alt = item.altText || '';
                            const textPart: TextPart = {
                                type: 'text' as const,
                                text: `![${alt}](${item.url})`,
                            }
                            textParts.push(textPart)
                            break
                        }
                        case 'tool-call':
                            // Only include completed tool calls with valid input
                            if (item.status === 'completed' && item.input !== undefined) {
                                toolCalls.push({
                                    type: 'tool-call',
                                    toolCallId: item.toolCallId,
                                    toolName: item.toolName,
                                    input: item.input,
                                })
                                toolResults.push({
                                    type: 'tool-result',
                                    toolCallId: item.toolCallId,
                                    toolName: item.toolName,
                                    output: {
                                        type: 'json',
                                        value: item.output ?? {},
                                    },
                                })
                            }
                            break
                    }
                }

                // Add assistant message if it has any content
                if (textParts.length > 0 || toolCalls.length > 0) {
                    history.push({
                        role: 'assistant',
                        content: [
                            ...textParts,
                            ...toolCalls,
                        ],
                    })
                }

                // Add tool results after the assistant message
                if (toolResults.length > 0) {
                    history.push({
                        role: 'tool',
                        content: toolResults,
                    })
                }
                break
            }
            case 'compaction': {
                history = [{
                    role: 'user',
                    content: [{ type: 'text', text: message.summary }],
                }]
                break
            }
        }
    }

    return history
}

type PublishToolCall = {
    sessionId: string;
    toolCallId: string;
    toolName: string;
    input: Record<string, unknown> | undefined;
    output: Record<string, unknown> | undefined;
    status: 'loading' | 'ready' | 'completed' | 'error';
    error?: string;
    startedAt?: string;
    completedAt?: string;
}

type ReasoningDetail = {
    type: string;
    text: string;
}
