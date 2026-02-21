import { BaseModelSchema } from "../common/index";
import { z } from "zod";
import { Conversation, ConversationFile, ConversationMessage } from "./conversation";
import { TodoList } from "./todo";

export * from "./conversation";
export * from "./todo";
export * from "./question";
export * from "./util";
export * from "./tool-preview";

export const Organization = BaseModelSchema.extend({
    userId: z.string(),
    sandboxId: z.string().nullable().optional(),
    defaultModelId: z.string().nullable().optional(),
});

export type Organization = z.infer<typeof Organization>

// Matches LanguageModelUsage from ai package (excluding deprecated fields)
export const AgentUsage = z.object({
    inputTokens: z.number().optional(),
    inputTokenDetails: z.object({
        noCacheTokens: z.number().optional(),
        cacheReadTokens: z.number().optional(),
        cacheWriteTokens: z.number().optional(),
    }).optional(),
    outputTokens: z.number().optional(),
    outputTokenDetails: z.object({
        textTokens: z.number().optional(),
        reasoningTokens: z.number().optional(),
    }).optional(),
    totalTokens: z.number().optional(),
});

export type AgentUsage = z.infer<typeof AgentUsage>

export enum AgentSessionStatus {
    RUNNING = "running",
    NEEDS_YOU = "needs_you",
    CLOSED = "closed",
}

export enum SessionSource {
    MAIN = "main",
    TELEGRAM = "telegram",
    AUTOMATION = "automation",
}
export const SessionLocation = z.object({
    city: z.string().nullable().optional(),
    region: z.string().nullable().optional(),
    country: z.string().nullable().optional(),
    timezone: z.string().nullable().optional(),
}).nullable().optional();

export type SessionLocation = z.infer<typeof SessionLocation>

export const Session = BaseModelSchema.extend({
    conversation: Conversation,
    todos: TodoList.default([]),
    usage: AgentUsage.nullable().optional(),
    isStreaming: z.boolean(),
    title: z.string(),
    agentId: z.string().nullable().optional(),
    status: z.nativeEnum(AgentSessionStatus).default(AgentSessionStatus.RUNNING),
    modelId: z.string(),
    cost: z.number().default(0),
    source: z.nativeEnum(SessionSource).default(SessionSource.MAIN),
    location: SessionLocation,
    isTest: z.boolean().default(false),
});

export type Session = z.infer<typeof Session>

export const SessionMetadata = BaseModelSchema.extend({
    todos: TodoList.default([]),
    usage: AgentUsage.nullable().optional(),
    isStreaming: z.boolean(),
    title: z.string(),
    agentId: z.string().nullable().optional(),
    status: z.nativeEnum(AgentSessionStatus).default(AgentSessionStatus.RUNNING),
    modelId: z.string(),
    cost: z.number().default(0),
    source: z.nativeEnum(SessionSource).default(SessionSource.MAIN),
    location: SessionLocation,
    isTest: z.boolean().default(false),
});

export type SessionMetadata = z.infer<typeof SessionMetadata>

export const ChatWithOktaManRequest = z.object({
    message: z.string(),
    files: z.array(ConversationFile).default([]),
    toolOutput: z.record(z.string(), z.any()).optional(),
    modelId: z.string().optional(),
});

export type ChatWithOktaManRequest = z.infer<typeof ChatWithOktaManRequest>

export const AnswerQuestionRequest = z.object({
    toolCallId: z.string(),
    output: z.record(z.string(), z.any()),
});

export type AnswerQuestionRequest = z.infer<typeof AnswerQuestionRequest>

export const ChatWithOktaManResponse = z.object({
    sessionId: z.string(),
    response: z.string(),
});

export type ChatWithOktaManResponse = z.infer<typeof ChatWithOktaManResponse>

// HTTP request body schema
export const CreateSessionRequestBody = z.object({
    userMessage: z.string(),
    source: z.nativeEnum(SessionSource).optional().default(SessionSource.MAIN),
    agentId: z.string().optional(),
    modelId: z.string().optional(),
});

// Internal type for service layer (includes ip and optional userId for backwards compatibility)
export const CreateSessionRequest = CreateSessionRequestBody.extend({
    userId: z.string().optional(),
    ip: z.string().optional(),
    isTest: z.boolean().optional(),
});

export type CreateSessionRequest = z.infer<typeof CreateSessionRequest>

export const DeleteSessionRequest = z.object({
    id: z.string(),
});

export type DeleteSessionRequest = z.infer<typeof DeleteSessionRequest>

export const UpdateSessionRequest = z.object({
    status: z.nativeEnum(AgentSessionStatus),
});

export type UpdateSessionRequest = z.infer<typeof UpdateSessionRequest>


export const ListSessionsRequest = z.object({});

export type ListSessionsRequest = z.infer<typeof ListSessionsRequest>

export const UpdateOrganizationRequest = z.object({
    sandboxId: z.string().nullable().optional(),
    defaultModelId: z.string().nullable().optional(),
});

export type UpdateOrganizationRequest = z.infer<typeof UpdateOrganizationRequest>

const MODEL_COST_ID = {
    'anthropic/claude-opus-4-5': 'anthropic/claude-opus-4.5',
};

export const getModelCostId = (modelId: string) => {
    return MODEL_COST_ID[modelId as keyof typeof MODEL_COST_ID] || modelId;
};
