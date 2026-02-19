import { BaseModelSchema } from '../common'
import { z } from 'zod'

export { AGENT_COLORS, AGENT_COLOR_NAMES } from './agent-colors'
export type { AgentColorName, AgentColorValue } from './agent-colors'

export enum AgentStatus {
    ENABLED = 'ENABLED',
    DISABLED = 'DISABLED',
}

export const AgentTrigger = z.object({
    type: z.string(),
    slug: z.string().optional(),
    triggerId: z.string().optional(),
    args: z.record(z.string(), z.any()).optional(),
    cron: z.string().optional(),
    scheduleId: z.string().optional(),
})

export type AgentTrigger = z.infer<typeof AgentTrigger>

export const Agent = BaseModelSchema.extend({
    webhookId: z.string(),
    name: z.string(),
    description: z.string(),
    trigger: AgentTrigger,
    instructions: z.string(),
    status: z.nativeEnum(AgentStatus),
    logoUrl: z.string().optional(),
    modelId: z.string(),
    color: z.string(),
})

export type Agent = z.infer<typeof Agent>

export const UpdateAgentRequest = z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    instructions: z.string().optional(),
    status: z.nativeEnum(AgentStatus).optional(),
    modelId: z.string().optional(),
})

export type UpdateAgentRequest = z.infer<typeof UpdateAgentRequest>

export const ListAgentsRequestQueryParams = z.object({})

export type ListAgentsRequestQueryParams = z.infer<typeof ListAgentsRequestQueryParams>

export const CreateAgentRequest = z.object({
    displayName: z.string(),
    description: z.string(),
    instructions: z.string(),
    trigger: AgentTrigger,
    triggerInput: z.record(z.string(), z.any()).optional(),
    folderId: z.string().optional(),
    folderName: z.string().optional(),
    webhookId: z.string(),
    modelId: z.string().optional(),
})

export type CreateAgentRequest = z.infer<typeof CreateAgentRequest>

export const CreateAgentResponse = z.object({
    id: z.string(),
    flowVersionId: z.string().optional(),
    flowId: z.string(),
    webhookId: z.string(),
})

export type CreateAgentResponse = z.infer<typeof CreateAgentResponse>