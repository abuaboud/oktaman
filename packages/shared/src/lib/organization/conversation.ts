import { z } from "zod"

export const UserTextConversationMessage = z.object({
  type: z.literal('text'),
  message: z.string(),
})
export type UserTextConversationMessage = z.infer<typeof UserTextConversationMessage>;

export const UserImageConversationMessage = z.object({
  type: z.literal('image'),
  image: z.string(),
  name: z.string().optional(),
})
export type UserImageConversationMessage = z.infer<typeof UserImageConversationMessage>;

export const UserFileConversationMessage = z.object({
  type: z.literal('file'),
  file: z.string(),
  name: z.string().optional(),
  mimeType: z.string().optional(),
})
export type UserFileConversationMessage = z.infer<typeof UserFileConversationMessage>;

export const UserInstructionsConversationMessage = z.object({
  type: z.literal('instructions'),
  instructions: z.string(),
})
export type UserInstructionsConversationMessage = z.infer<typeof UserInstructionsConversationMessage>;

export const UserTriggerPayloadConversationMessage = z.object({
  type: z.literal('trigger-payload'),
  payload: z.record(z.string(), z.any()),
  triggerName: z.string().optional(),
})
export type UserTriggerPayloadConversationMessage = z.infer<typeof UserTriggerPayloadConversationMessage>;

export const UserConversationMessage = z.object({
  role: z.literal('user'),
  content: z.array(
    z.union([
      UserTextConversationMessage,
      UserImageConversationMessage,
      UserFileConversationMessage,
      UserInstructionsConversationMessage,
      UserTriggerPayloadConversationMessage,
    ])
  ),
  sentAt: z.string().optional(),
})
export type UserConversationMessage = z.infer<typeof UserConversationMessage>;

export const TextConversationMessage = z.object({
  type: z.literal('text'),
  message: z.string(),
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
})
export type TextConversationMessage = z.infer<typeof TextConversationMessage>;

export const ThinkingConversationMessage = z.object({
  type: z.literal('thinking'),
  message: z.string(),
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
})
export type ThinkingConversationMessage = z.infer<typeof ThinkingConversationMessage>;

export const AssistantAttachmentConversationMessage = z.object({
  type: z.literal('assistant-attachment'),
  url: z.string(),
  altText: z.string().optional(),
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
})
export type AssistantAttachmentConversationMessage = z.infer<typeof AssistantAttachmentConversationMessage>;

export const ToolCallConversationMessage = z.object({
  type: z.literal('tool-call'),
  toolName: z.string(),
  toolCallId: z.string(),
  input: z.record(z.string(), z.any()).optional(),
  output: z.record(z.string(), z.any()).optional(),
  status: z.union([z.literal('loading'), z.literal('ready'), z.literal('completed'), z.literal('error')]),
  error: z.string().optional(),
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
})
export type ToolCallConversationMessage = z.infer<typeof ToolCallConversationMessage>;

export const AssistantConversationContent = z.union([
  TextConversationMessage,
  ThinkingConversationMessage,
  AssistantAttachmentConversationMessage,
  ToolCallConversationMessage,
])
export type AssistantConversationContent = z.infer<typeof AssistantConversationContent>;

export const AssistantConversationMessage = z.object({
  role: z.literal('assistant'),
  parts: z.array(AssistantConversationContent),
  cost: z.number().optional(),
  sentAt: z.string().optional(),
})
export type AssistantConversationMessage = z.infer<typeof AssistantConversationMessage>;

export const CompactionConversationMessage = z.object({
  role: z.literal('compaction'),
  summary: z.string(),
})
export type CompactionConversationMessage = z.infer<typeof CompactionConversationMessage>;

export const InterruptedConversationMessage = z.object({
  role: z.literal('interrupted'),
  message: z.string(),
  timestamp: z.string(),
})
export type InterruptedConversationMessage = z.infer<typeof InterruptedConversationMessage>;

export const ConversationMessage = z.union([
  UserConversationMessage,
  AssistantConversationMessage,
  CompactionConversationMessage,
  InterruptedConversationMessage,
])
export type ConversationMessage = z.infer<typeof ConversationMessage>;

export const Conversation = z.array(ConversationMessage);
export type Conversation = z.infer<typeof Conversation>;

export const ConversationFile = z.object({
  name: z.string(),
  type: z.string(),
  url: z.string(),
  content: z.string().optional(),
})
export type ConversationFile = z.infer<typeof ConversationFile>;