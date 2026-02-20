import { BaseModelEntityColumns, Settings } from "@oktaman/shared";
import { EntitySchema } from "typeorm";

export const SettingsEntitySchema = new EntitySchema<Settings>({
    name: 'settings',
    columns: {
        ...BaseModelEntityColumns,
        provider: {
            type: 'simple-json',
            nullable: true,
            default: null,
        },
        defaultModelId: {
            type: String,
            nullable: false,
            default: 'moonshotai/kimi-k2.5'
        },
        embeddingModelId: {
            type: String,
            nullable: false,
            default: 'openai/text-embedding-3-small'
        },
        composioApiKey: {
            type: String,
            nullable: true
        },
        composioWebhookSecret: {
            type: String,
            nullable: true
        },
        firecrawlApiKey: {
            type: String,
            nullable: true
        },
        channels: {
            type: 'simple-json',
            nullable: false,
            default: '[]'
        },
        setupCompleted: {
            type: Boolean,
            nullable: false,
            default: false
        }
    }
});
