import { BaseModelSchema } from '../common'
import { z } from 'zod'

export enum ChannelType {
    TELEGRAM = 'TELEGRAM',
}

// Telegram configuration
export const TelegramChannelConfig = z.object({
    botToken: z.string(),
    pairedChatId: z.string().nullable().default(null),
})

export type TelegramChannelConfig = z.infer<typeof TelegramChannelConfig>

// Channel config (only Telegram for now)
export const ChannelConfig = TelegramChannelConfig

export type ChannelConfig = z.infer<typeof ChannelConfig>

// Main Channel entity
export const Channel = BaseModelSchema.extend({
    name: z.string(),
    type: z.nativeEnum(ChannelType),
    config: ChannelConfig,
})

export type Channel = z.infer<typeof Channel>

// API request/response types
export const CreateChannelRequest = z.object({
    name: z.string(),
    type: z.nativeEnum(ChannelType),
    config: ChannelConfig,
})

export type CreateChannelRequest = z.infer<typeof CreateChannelRequest>

export const UpdateChannelRequest = z.object({
    name: z.string().optional(),
    config: ChannelConfig.optional(),
})

export type UpdateChannelRequest = z.infer<typeof UpdateChannelRequest>

export const ListChannelsQueryParams = z.object({})

export type ListChannelsQueryParams = z.infer<typeof ListChannelsQueryParams>
