import { BaseModelEntityColumns, MemoryBlock } from "@oktaman/shared";
import { EntitySchema } from "typeorm";

export const MemoryBlockEntitySchema = new EntitySchema<MemoryBlock>({
    name: 'memory_block',
    columns: {
        ...BaseModelEntityColumns,
        content: {
            type: String,
            nullable: false
        },
        embedding: {
            type: 'text',
            nullable: true,
            transformer: {
                to: (value: number[] | null) => value ? JSON.stringify(value) : null,
                from: (value: string | null) => {
                    if (!value) return null;
                    return JSON.parse(value);
                }
            }
        },
    },
});
