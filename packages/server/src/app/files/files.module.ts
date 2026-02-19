import { FastifyInstance } from 'fastify'
import { filesController } from './files.controller'

export async function filesModule(fastify: FastifyInstance): Promise<void> {
    await fastify.register(filesController)
}
