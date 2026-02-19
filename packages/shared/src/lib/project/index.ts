import { BaseModelSchema } from "../common";
import { z } from "zod";

export const Project = BaseModelSchema.extend({
    displayName: z.string(),
    ownerId: z.string(),
});

export type Project = z.infer<typeof Project>;