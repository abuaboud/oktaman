import { BaseModelSchema } from "../common/index";
import { z } from "zod";

export const OpenRouterKey = BaseModelSchema.extend({
    organizationId: z.string(),
    apiKey: z.string(),
    apiKeyHash: z.string(),
});

export type OpenRouterKey = z.infer<typeof OpenRouterKey>
