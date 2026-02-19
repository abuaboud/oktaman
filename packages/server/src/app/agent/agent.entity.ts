import { EntitySchema } from 'typeorm'
import { BaseModelEntityColumns, Agent } from '@oktaman/shared'

export const AgentEntity = new EntitySchema<Agent>({
    name: 'agent',
    columns: {
        ...BaseModelEntityColumns,
        webhookId: {
            type: String,
            nullable: false,
            unique: true,
        },
        name: {
            type: String,
            nullable: false,
        },
        description: {
            type: String,
            nullable: false,
        },
        trigger: {
            type: 'simple-json',
            nullable: false,
        },
        instructions: {
            type: String,
            nullable: false,
        },
        status: {
            type: String,
            nullable: false,
        },
        modelId: {
            type: String,
            nullable: false,
        },
        color: {
            type: String,
            nullable: false,
        },
    },
    relations: {

    },
    indices: [
        {
            name: 'idx_agent_webhook_id',
            columns: ['webhookId'],
            unique: true,
        },
    ],
})
