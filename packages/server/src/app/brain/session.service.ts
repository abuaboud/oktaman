import { databaseConnection } from '../database/database-connection';
import { apSessionId, Session, SessionMetadata, Conversation, OktaManError, OktaManErrorCode, AgentUsage, CreateSessionRequest, AgentSessionStatus, TodoList, AgentStreamingEvent, AgentStreamingUpdate, spreadIfDefined, SessionSource, isNil, cleanJson } from '@oktaman/shared';
import { SessionEntitySchema } from './session.entity';
import dayjs from 'dayjs';
import { generateText } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { websocketService } from '../core/websockets';
import { logger } from '../common/logger';
import { OPENROUTER_API_KEY } from '../common/system';
import { geolocationService } from '../common/geolocation.service';

const sessionRepository = databaseConnection.getRepository<Session>(SessionEntitySchema);

const DEFAULT_MODEL_ID = 'anthropic/claude-opus-4-5';

export const sessionService = {
    async create(params: CreateSessionRequest ): Promise<Session> {
        const { userMessage, agentId, modelId, source, userId, ip, isTest } = params;

        // Get location from IP (geolocation service handles errors and returns null on failure)
        const location = ip ? await geolocationService.getLocationFromIp(ip) : null;

        const sessionId = apSessionId();

        // Validate ID generation
        if (!sessionId || sessionId === 'undefined' || sessionId === 's_undefined') {
            logger.error('[SessionService] Failed to generate valid session ID');
            throw new Error('Failed to generate valid session ID');
        }

        const newSession: Session = {
            id: sessionId,
            isStreaming: false,
            status: AgentSessionStatus.RUNNING,
            conversation: [],
            todos: [],
            title: 'New Chat',
            agentId: agentId || null,
            modelId: modelId || DEFAULT_MODEL_ID,
            cost: 0,
            source,
            location,
            isTest: isTest || false,
            created: dayjs().toDate(),
            updated: dayjs().toDate(),
        };

        const savedSession = await sessionRepository.save(newSession);

        logger.info({ sessionId: savedSession.id }, '[SessionService] Session created successfully');

        // Generate title asynchronously and emit update
        generateAndEmitSessionTitle(savedSession.id, userMessage).catch((error) => {
            logger.error(
                { error: error instanceof Error ? error.message : String(error), sessionId: savedSession.id },
                '[SessionService] Failed to generate session title'
            );
        });

        return savedSession;
    },

    async getOne(params: GetOneParams): Promise<Session | null> {
        const { id } = params;
        return await sessionRepository.findOne({
            where: { id }
        });
    },

    async getOneOrThrow(params: GetOneParams): Promise<Session> {
        const session = await this.getOne(params);
        if (!session) {
            throw new OktaManError({
                code: OktaManErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityType: 'session',
                    entityId: params.id,
                    message: `Session with id ${params.id} not found`
                }
            });
        }
        return session;
    },

    async list(): Promise<SessionMetadata[]> {
        const sessions = await sessionRepository.find({
            order: {
                updated: 'DESC'
            },
            select: ['id', 'usage', 'isStreaming', 'title', 'created', 'updated', 'agentId', 'status', 'todos', 'modelId', 'cost', 'source']
        });
        return sessions
    },

    async update(params: UpdateSessionParams): Promise<Session> {
        const { id, conversation, todos, usage, isStreaming, title, status, modelId, cost } = params;

        await sessionRepository.update(id, {
            ...spreadIfDefined('conversation', conversation ? cleanJson(conversation) : undefined),
            ...spreadIfDefined('todos', todos ? cleanJson(todos) : undefined),
            ...spreadIfDefined('usage', usage),
            ...spreadIfDefined('isStreaming', isStreaming),
            ...spreadIfDefined('title', title ? cleanJson(title) : undefined),
            ...spreadIfDefined('status', status),
            ...spreadIfDefined('modelId', modelId),
            ...spreadIfDefined('cost', cost),
            updated: dayjs().toDate(),
        });
        return this.getOneOrThrow({ id });
    },

    async delete(params: DeleteParams): Promise<boolean> {
        const { id } = params;
        const session = await this.getOneOrThrow({ id });
        await sessionRepository.remove(session);
        return true;
    },

    async getOrCreateSessionForTelegram(params: GetOrCreateSessionForTelegramParams): Promise<Session> {
        // Look for existing telegram session for this agent
        const existingSession = await sessionRepository.findOne({
            where: {
                source: SessionSource.TELEGRAM,
            },
            order: {
                updated: 'DESC'
            }
        });
        if(!isNil(existingSession)) {
            return existingSession;
        }
        return this.create({
            userMessage: 'New Telegram Chat',
            agentId: undefined,
            modelId: params.modelId,
            source: SessionSource.TELEGRAM,
        });

    }
};

async function generateAndEmitSessionTitle(sessionId: string, userMessage: string): Promise<void> {
    // Generate the title
    if (!OPENROUTER_API_KEY) {
        logger.warn({ sessionId }, '[SessionService] No OpenRouter API key configured, skipping title generation');
        return;
    }

    const openrouter = createOpenRouter({
        apiKey: OPENROUTER_API_KEY,
    });

    const { text } = await generateText({
        model: openrouter('anthropic/claude-3.5-haiku'),
        prompt: `Generate a very short (3-5 words maximum) title for a chat conversation that starts with this user message. The title should capture the main topic or intent. Only return the title, nothing else.

User message: ${userMessage}`,
    });

    // Trim and limit length to ensure it's concise
    const trimmedTitle = text.trim().replace(/^["']|["']$/g, ''); // Remove quotes if present
    const generatedTitle = trimmedTitle.length > 50 ? trimmedTitle.slice(0, 50) + '...' : trimmedTitle;
    // Update the session in the database
    await sessionService.update({
        id: sessionId,
        title: generatedTitle,
    });

    // Emit websocket event to notify the client
    const sessionUpdate: AgentStreamingUpdate = {
        event: AgentStreamingEvent.AGENT_SESSION_UPDATE,
        data: {
            sessionId,
            status: AgentSessionStatus.RUNNING,
            title: generatedTitle,
        },
    };

    const io = websocketService.getIo();
    io.to('main-user').emit(sessionUpdate.event, sessionUpdate);

    logger.info({ sessionId, title: generatedTitle }, '[SessionService] Session title generated and emitted');
}


type DeleteParams = {
    id: string;
}

type UpdateSessionParams = {
    id: string;
    status?: AgentSessionStatus;
    conversation?: Conversation;
    todos?: TodoList;
    usage?: AgentUsage;
    isStreaming?: boolean;
    title?: string;
    modelId?: string;
    cost?: number;
}

type GetOneParams = {
    id: string;
}

type GetOrCreateSessionForTelegramParams = {
    modelId: string;
}

