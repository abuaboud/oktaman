import { BaseModelSchema } from "../common";
import { z } from "zod";

export const Waitlist = BaseModelSchema.extend({
    name: z.string(),
    email: z.string(),
    prompt: z.string().optional()
});

export type Waitlist = z.infer<typeof Waitlist>;


export const CreateWaitlistRequest = z.object({
    name: z.string(),
    email: z.string(),
    prompt: z.string().optional()
});

export type CreateWaitlistRequest = z.infer<typeof CreateWaitlistRequest>;