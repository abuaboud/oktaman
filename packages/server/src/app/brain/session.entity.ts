import { BaseModelEntityColumns, Session, Agent } from "@oktaman/shared";
import { EntitySchema } from "typeorm";

type SessionEnriched = Session & {
    agent?: Agent;
}

export const SessionEntitySchema = new EntitySchema<SessionEnriched>({
    name: 'session',
    columns: {
        ...BaseModelEntityColumns,
        conversation: {
            type: 'simple-json',
            nullable: false,
            default: '[]'
        },
        todos: {
            type: 'simple-json',
            nullable: false,
            default: '[]'
        },
        usage: {
            type: 'simple-json',
            nullable: true,
        },
        isStreaming: {
            type: Boolean,
            nullable: false,
            default: false,
        },
        title: {
            type: String,
        },
        agentId: {
            type: String,
            nullable: true,
        },
        status: {
            type: String,
            nullable: false,
            default: 'running',
        },
        modelId: {
            type: String,
            nullable: false,
        },
        cost: {
            type: 'real',
            nullable: false,
            default: 0,
        },
        source: {
            type: String,
            nullable: false,
            default: 'main',
        },
        location: {
            type: 'simple-json',
            nullable: true,
        },
        isTest: {
            type: Boolean,
            nullable: false,
            default: false,
        },
    },
    relations: {
        agent: {
            type: 'many-to-one',
            target: 'agent',
            joinColumn: {
                name: 'agentId',
                referencedColumnName: 'id'
            },
            onDelete: 'SET NULL',
            nullable: true
        }
    }
});
