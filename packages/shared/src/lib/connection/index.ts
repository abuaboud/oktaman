import { z } from 'zod';

export const Connection = z.object({
  slug: z.string(),
  name: z.string(),
  logo: z.string().optional(),
});

export type Connection = z.infer<typeof Connection>;