import { FastifyInstance } from 'fastify';
import { createSerializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod';
import fastifyCookie from '@fastify/cookie';
import fastifyCors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import fastifyMultipart from '@fastify/multipart';
import { errorHandler } from './common/error-handler';
import { healthModule } from './core/health/health.module';
import fastifySocketIO from './plugins/fastify-socket';
import { Socket } from 'socket.io';
import { oktamanModule } from './brain/oktaman.module';
import { agentModule } from './agent/agent.module';
import { filesModule } from './files/files.module';
import { logger } from './common/logger';
import { API_BASE_URL } from './common/system';
import path from 'path';

/* eslint-disable-next-line */
export interface AppOptions { }

type ReplacerFunction = (this: any, key: string, value: any) => any;

const replacer: ReplacerFunction = function (key: string, value: any) {
    if (value instanceof Date) {
        return value.toISOString()
    }
    return value;
};

export async function app(fastify: FastifyInstance, opts: AppOptions): Promise<void> {
    fastify.withTypeProvider<ZodTypeProvider>();
    fastify.setSerializerCompiler(createSerializerCompiler({
        replacer
    }));
    fastify.setValidatorCompiler(validatorCompiler);

    // Register CORS with credentials support
    await fastify.register(fastifyCors, {
        origin: API_BASE_URL,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
    });

    // Register cookie parser
    await fastify.register(fastifyCookie);

    // Register multipart for file uploads
    await fastify.register(fastifyMultipart, {
        limits: {
            fileSize: 100 * 1024 * 1024, // 100MB max file size
        }
    });

    await fastify.setErrorHandler(errorHandler)
    await fastify.register(healthModule)
    await fastify.register(oktamanModule)
    await fastify.register(agentModule)
    await fastify.register(filesModule)

    await fastify.register(fastifySocketIO, {
        cors: {
            origin: '*',
        },
        transports: ['websocket'],
    })

    fastify.io.on('connection', (socket: Socket) => {
        socket.join('main-user')
        logger.info('Socket connected and joined main-user room')
    })

    // Serve static files from UI dist folder (after all API routes)
    const uiDistPath = path.join(__dirname, '..', '..', '..', 'ui', 'dist');
    await fastify.register(fastifyStatic, {
        root: uiDistPath,
        prefix: '/',
    });

    // Handle SPA routing - serve index.html for non-API routes
    fastify.setNotFoundHandler(async (request, reply) => {
        if (request.url.startsWith('/v1/') || request.url.startsWith('/api/v1/') || request.url.startsWith('/socket.io')) {
            return reply.code(404).send({ error: 'Not found' });
        }
        return reply.sendFile('index.html');
    });

}
