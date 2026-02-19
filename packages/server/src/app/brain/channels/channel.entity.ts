import { BaseModelEntityColumns, Channel } from "@oktaman/shared";
import { EntitySchema } from "typeorm";

export const ChannelEntitySchema = new EntitySchema<Channel>({
    name: 'channel',
    columns: {
        ...BaseModelEntityColumns,
        name: {
            type: String,
            nullable: false
        },
        type: {
            type: String,
            nullable: false
        },
        config: {
            type: 'simple-json',
            nullable: false,
        }
    },
    indices: [
        {
            name: 'idx_channel_type',
            columns: ['type']
        }
    ]
});
