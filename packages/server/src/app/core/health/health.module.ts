import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

export const healthModule: FastifyPluginAsyncZod = async (fastify) => {
    fastify.get('/health', async () => {
        return { status: 'ok' };
    });
}
