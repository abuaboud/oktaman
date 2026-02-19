import { z } from "zod";

export const BillingPlanRequest = z.object({
    agentId: z.string()
});

export type BillingPlanRequest = z.infer<typeof BillingPlanRequest>;

export const BillingPlanResponse = z.object({
    limitRemaining: z.number(),
    usage: z.number()
});

export type BillingPlanResponse = z.infer<typeof BillingPlanResponse>;
