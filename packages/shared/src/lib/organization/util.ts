import { AssistantConversationMessage, CompactionConversationMessage, Conversation, ConversationFile, ToolCallConversationMessage, UserConversationMessage } from "./conversation"
import { AgentStreamingUpdateProgressData } from "./dto"
import { AgentQuestion, AskQuestionInput, ConnectionQuestion, QuestionAnswer, QuestionType } from "./question"
export const conversationUtils = {
    streamChunk(conversation: Conversation, chunk: AgentStreamingUpdateProgressData): Conversation {
        const newConvo: Conversation = [...conversation]
        const lastMessageIsAssistant = conversation.length > 0 && newConvo[newConvo.length - 1].role === 'assistant'
        if (!lastMessageIsAssistant) {
            newConvo.push({
                role: 'assistant',
                parts: [],
            })
        }

        const lastAssistantMessage: AssistantConversationMessage = {
            ...newConvo[newConvo.length - 1] as AssistantConversationMessage,
            parts: [...(newConvo[newConvo.length - 1] as AssistantConversationMessage).parts],
        }
        newConvo[newConvo.length - 1] = lastAssistantMessage

        // Handle part updates if part is provided
        if (chunk.part) {
            if (chunk.part.type === 'text-delta') {
                const lastPart = lastAssistantMessage.parts.length > 0 ? lastAssistantMessage.parts[lastAssistantMessage.parts.length - 1] : null
                if (lastPart && lastPart.type === 'text') {
                    // Appending to existing text - keep original startedAt, update completedAt
                    lastAssistantMessage.parts[lastAssistantMessage.parts.length - 1] = {
                        type: 'text',
                        message: lastPart.message + chunk.part.message,
                        startedAt: lastPart.startedAt,
                        completedAt: chunk.part.startedAt,
                    }
                } else {
                    // New text part - set startedAt
                    lastAssistantMessage.parts.push({
                        type: 'text',
                        message: chunk.part.message,
                        startedAt: chunk.part.startedAt,
                    })
                }
            } else if (chunk.part.type === 'thinking-delta') {
                const lastPart = lastAssistantMessage.parts.length > 0 ? lastAssistantMessage.parts[lastAssistantMessage.parts.length - 1] : null
                const currentTime = chunk.part.startedAt || createTimestamp();
                if (lastPart && lastPart.type === 'thinking') {
                    // Appending to existing thinking - keep original startedAt, update completedAt
                    lastAssistantMessage.parts[lastAssistantMessage.parts.length - 1] = {
                        type: 'thinking',
                        message: lastPart.message + chunk.part.message,
                        startedAt: lastPart.startedAt || currentTime,
                        completedAt: currentTime,
                    }
                } else {
                    // New thinking part - set startedAt
                    lastAssistantMessage.parts.push({
                        type: 'thinking',
                        message: chunk.part.message,
                        startedAt: currentTime,
                    })
                }
            } else if (chunk.part.type === 'tool-call') {
                const toolCallId = chunk.part.toolCallId
                const existingIndex = lastAssistantMessage.parts.findIndex(
                    (part) =>
                        part.type === 'tool-call' &&
                        part.toolCallId === toolCallId
                )
                if (existingIndex !== -1) {
                    lastAssistantMessage.parts[existingIndex] = {
                        ...lastAssistantMessage.parts[existingIndex],
                        ...chunk.part,
                    }
                } else {
                    lastAssistantMessage.parts.push(chunk.part)
                }
            } else {
                lastAssistantMessage.parts.push(chunk.part)
            }
        }

        // Update cost if provided
        if (chunk.cost !== undefined) {
            lastAssistantMessage.cost = chunk.cost;
        }

        return newConvo
    },
    addEmptyAssistantMessage(conversation: Conversation): Conversation {
        return [...conversation, {
            role: 'assistant',
            parts: [],
            sentAt: createTimestamp(),
        }]
    },
    addUserMessage(params: AddUserMessageParams): Conversation {
        const {
            conversation,
            message,
            files,
            triggerPayload,
            instructions,
        } = params

        const content: UserConversationMessage['content'] = []

        // Add text message if present
        if (message.trim()) {
            content.push({
                type: 'text',
                message: message,
            })
        }

        // Add trigger payload as separate content item
        if (triggerPayload) {
            content.push({
                type: 'trigger-payload',
                payload: triggerPayload.payload,
                triggerName: triggerPayload.triggerName,
            })
        }

        // Add file attachments
        if (files && files.length > 0) {
            for (const file of files) {
                if (file.type.startsWith('image/')) {
                    content.push({
                        type: 'image',
                        image: file.url,
                        name: file.name,
                    })
                } else if (file.type === 'application/pdf') {
                    content.push({
                        type: 'file',
                        file: file.url,
                        name: file.name,
                        mimeType: file.type,
                    })
                } else if (file.content) {
                    // For text-based files, include content as text
                    content.push({
                        type: 'text',
                        message: `File: ${file.name}\n\`\`\`\n${file.content}\n\`\`\``,
                    })
                }
            }
        }

        // Add instructions if present (render at the end)
        if (instructions) {
            content.push({
                type: 'instructions',
                instructions,
            })
        }

        return [...conversation, {
            role: 'user',
            content,
            sentAt: createTimestamp(),
        }]
    },
    addCompactionMessage(
        conversation: Conversation,
        compaction: CompactionConversationMessage
    ): Conversation {
        return [...conversation, compaction]
    },
    updateToolOutput(
        conversation: Conversation,
        toolOutput: Record<string, any>
    ): Conversation {
        const lastMessage = conversation[conversation.length - 1];
        if(lastMessage.role !== 'assistant') {
            throw new Error('Last message is not an assistant message');
        }
        lastMessage.parts[lastMessage.parts.length - 1] = {
            ...lastMessage.parts[lastMessage.parts.length - 1],
            status: 'completed',
            completedAt: createTimestamp(),
            output: toolOutput,
        } as ToolCallConversationMessage;
        return conversation;
    },
    extractQuestionFromToolResult(toolResult: ToolCallResult): AgentQuestion[] {
        if(toolResult.toolName === 'ask_question') {
            const input = toolResult.input as AskQuestionInput | undefined;
            return input?.questions ?? [];
        }
        if(toolResult.toolName === 'COMPOSIO_MANAGE_CONNECTIONS') {
            return extractConnectionQuestions(toolResult);
        }
        return []
    },
    getQuestions(conversation: Conversation): AgentQuestion[] {
        const lastMessage = conversation[conversation.length - 1];
        if (!lastMessage || lastMessage.role !== 'assistant') {
            return [];
        }
        // Find the last tool-call part (there may be text messages after it)
        const lastToolCall = [...lastMessage.parts].reverse().find(part => part.type === 'tool-call');
        if(!lastToolCall || lastToolCall.type !== 'tool-call') {
            return [];
        }
        return conversationUtils.extractQuestionFromToolResult({
            toolName: lastToolCall.toolName,
            input: lastToolCall.input,
            output: lastToolCall.output,
        });
    },
}

type AddUserMessageParams = {
    conversation: Conversation
    message: string
    files?: ConversationFile[]
    triggerPayload?: { payload: Record<string, any>; triggerName?: string }
    instructions?: string
}

type ToolCallResult = {
    toolName: string;
    input: Record<string, any> | undefined;
    output: Record<string, any> | undefined;
}

function extractConnectionQuestions(toolCall: ToolCallResult): ConnectionQuestion[] {
    const output = toolCall.output as ComposioToolOutput | undefined;
    const connections = Object.values(output?.data?.results ?? {}).filter((result) => result.status === 'initiated' && result.redirect_url);
    return connections.map((result) => ({
        toolkit: result.toolkit,
        redirectUrl: result.redirect_url!,
        connectionId: result.connection_id ?? undefined,
        name: result.toolkit,
        type: QuestionType.CONNECTION_CARD as const,
    }))
}


interface ComposioToolOutput {
    data: {
        message?: string;
        results?: Record<string, {
            toolkit: string;
            status: 'initiated' | 'active' | 'failed';
            redirect_url?: string;
            instruction?: string;
            connection_id?: string;
            was_reinitiated?: boolean;
        }>;
        session?: {
            id: string;
            instructions?: string;
        };
    };
    error: string | null;
    successful: boolean;
    logId?: string;
}

function createTimestamp(): string {
    return new Date().toISOString();
}