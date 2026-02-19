import { BaseModelSchema } from "../common";
import { z } from "zod";

export const MemoryBlock = BaseModelSchema.extend({
    content: z.string(),
    embedding: z.array(z.number()).nullable().optional(),
});

export type MemoryBlock = z.infer<typeof MemoryBlock>

export const RememberRequest = z.object({
    content: z.string(),
});

export type RememberRequest = z.infer<typeof RememberRequest>

export const ForgetRequest = z.object({
    ids: z.array(z.string()),
});

export type ForgetRequest = z.infer<typeof ForgetRequest>

export const SearchRequest = z.object({
    queryString: z.string(),
});

export type SearchRequest = z.infer<typeof SearchRequest>
