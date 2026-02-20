import { BaseModelSchema } from '../common'
import { z } from 'zod'

// Provider types for AI model configuration
export const ProviderType = z.enum(['openrouter', 'openai', 'ollama'])
export type ProviderType = z.infer<typeof ProviderType>

export const ProviderConfig = z.object({
    type: ProviderType,
    apiKey: z.string().optional(),
    baseUrl: z.string().optional(),
})
export type ProviderConfig = z.infer<typeof ProviderConfig>

// Channel configuration stored in Settings (renamed to avoid conflict with channel/index.ts)
export const SettingsChannelConfig = z.object({
    id: z.string(),
    name: z.string(),
    type: z.enum(['TELEGRAM', 'SLACK']),
    config: z.record(z.string(), z.unknown()),
    enabled: z.boolean().default(true),
    created: z.string(),
    updated: z.string(),
})

export type SettingsChannelConfig = z.infer<typeof SettingsChannelConfig>

export const PairingCode = z.object({
    code: z.string(),
    channelId: z.string(),
    expiresAt: z.string(),
}).nullable()

export type PairingCode = z.infer<typeof PairingCode>

// Main Settings entity (singleton pattern)
export const Settings = BaseModelSchema.extend({
    // LLM Configuration
    provider: ProviderConfig.nullable(),
    defaultModelId: z.string().default('moonshotai/kimi-k2.5'),
    embeddingModelId: z.string().default('openai/text-embedding-3-small'),

    // Tools Configuration
    composioApiKey: z.string().nullable(),
    composioWebhookSecret: z.string().nullable(),
    firecrawlApiKey: z.string().nullable(),

    // Channels Configuration
    channels: z.array(SettingsChannelConfig).default([]),

    // Pairing Code
    pairingCode: PairingCode.default(null),

    // Onboarding State
    setupCompleted: z.boolean().default(false),
})

export type Settings = z.infer<typeof Settings>

// API Request Types
export const UpdateLlmSettingsRequest = z.object({
    provider: ProviderConfig.optional(),
    defaultModelId: z.string().optional(),
    embeddingModelId: z.string().optional(),
})

export type UpdateLlmSettingsRequest = z.infer<typeof UpdateLlmSettingsRequest>

export const UpdateToolsSettingsRequest = z.object({
    composioApiKey: z.string().optional(),
    composioWebhookSecret: z.string().optional(),
    firecrawlApiKey: z.string().optional(),
})

export type UpdateToolsSettingsRequest = z.infer<typeof UpdateToolsSettingsRequest>

export const AddSettingsChannelRequest = z.object({
    name: z.string(),
    type: z.enum(['TELEGRAM', 'SLACK']),
    config: z.record(z.string(), z.unknown()),
})

export type AddSettingsChannelRequest = z.infer<typeof AddSettingsChannelRequest>

export const UpdateSettingsChannelRequest = z.object({
    name: z.string().optional(),
    config: z.record(z.string(), z.unknown()).optional(),
    enabled: z.boolean().optional(),
})

export type UpdateSettingsChannelRequest = z.infer<typeof UpdateSettingsChannelRequest>

// Validation Result
export const ValidationResult = z.object({
    isValid: z.boolean(),
    missing: z.array(z.string()),
    warnings: z.array(z.string()),
})

export type ValidationResult = z.infer<typeof ValidationResult>
