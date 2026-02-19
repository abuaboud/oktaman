import { Server } from 'socket.io';

declare module 'fastify' {
    // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
    interface FastifyInstance {
        io: Server<{ hello: string }>
    }
}