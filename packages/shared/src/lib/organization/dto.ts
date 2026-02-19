
import { z } from "zod";
import { CompactionConversationMessage, ToolCallConversationMessage } from "./conversation";
import { AgentSessionStatus, AgentUsage } from "./index";

export enum AgentStreamingEvent {
  AGENT_STREAMING_UPDATE = 'AGENT_STREAMING_UPDATE',
  AGENT_STREAMING_ENDED = 'AGENT_STREAMING_ENDED',
  AGENT_COMPACTION = 'AGENT_COMPACTION',
  AGENT_SESSION_UPDATE = 'AGENT_SESSION_UPDATE',
  COLLECTION_UPDATE = 'COLLECTION_UPDATE',
}
export const TextDeltaConversationMessage = z.object({
  type: z.literal('text-delta'),
  message: z.string(),
  startedAt: z.string(),
})
export type TextDeltaConversationMessage = z.infer<typeof TextDeltaConversationMessage>;

export const ThinkingDeltaConversationMessage = z.object({
  type: z.literal('thinking-delta'),
  message: z.string(),
  startedAt: z.string(),
})
export type ThinkingDeltaConversationMessage = z.infer<typeof ThinkingDeltaConversationMessage>;


export const AgentStreamingUpdateProgressData = z.object({
  sessionId: z.string().optional(),
  part: z.union([TextDeltaConversationMessage, ThinkingDeltaConversationMessage, ToolCallConversationMessage]).optional(),
  cost: z.number().optional(),
});
export type AgentStreamingUpdateProgressData = z.infer<typeof AgentStreamingUpdateProgressData>;

export const AgentCompactionData = z.object({
  sessionId: z.string(),
  compaction: CompactionConversationMessage,
});
export type AgentCompactionData = z.infer<typeof AgentCompactionData>;

export const AgentStreamingEndedData = z.object({
  sessionId: z.string(),
  usage: AgentUsage,
});
export type AgentStreamingEndedData = z.infer<typeof AgentStreamingEndedData>;

export const AgentSessionUpdateData = z.object({
  sessionId: z.string(),
  status: z.nativeEnum(AgentSessionStatus),
  title: z.string().optional(),
  isStreaming: z.boolean().optional(),
  usage: AgentUsage.optional(),
  cost: z.number().optional(),
});
export type AgentSessionUpdateData = z.infer<typeof AgentSessionUpdateData>;

const AgentStreamingUpdateProgress = z.object({
  event: z.literal(AgentStreamingEvent.AGENT_STREAMING_UPDATE),
  data: AgentStreamingUpdateProgressData,
});

const AgentCompactionUpdate = z.object({
  event: z.literal(AgentStreamingEvent.AGENT_COMPACTION),
  data: AgentCompactionData,
});

const AgentStreamingEnded = z.object({
  event: z.literal(AgentStreamingEvent.AGENT_STREAMING_ENDED),
  data: AgentStreamingEndedData,
});

const AgentSessionUpdate = z.object({
  event: z.literal(AgentStreamingEvent.AGENT_SESSION_UPDATE),
  data: AgentSessionUpdateData,
});

export const CollectionOperation = z.enum(['insert', 'update', 'delete']);
export type CollectionOperation = z.infer<typeof CollectionOperation>;

export const CollectionUpdateData = z.object({
  organizationId: z.string(),
  collection: z.enum(['agents', 'sessions']),
  operation: CollectionOperation,
  entity: z.unknown().optional(),
});
export type CollectionUpdateData = z.infer<typeof CollectionUpdateData>;

export const CollectionUpdate = z.object({
  event: z.literal(AgentStreamingEvent.COLLECTION_UPDATE),
  data: CollectionUpdateData,
});
export type CollectionUpdate = z.infer<typeof CollectionUpdate>;

export const AgentStreamingUpdate = z.union([
  AgentStreamingUpdateProgress,
  AgentCompactionUpdate,
  AgentStreamingEnded,
  AgentSessionUpdate,
  CollectionUpdate,
]);
export type AgentStreamingUpdate = z.infer<typeof AgentStreamingUpdate>;
