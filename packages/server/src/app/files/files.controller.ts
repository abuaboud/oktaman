import { FastifyInstance, FastifyRequest } from 'fastify'
import { filesService } from './files.service'

export async function filesController(fastify: FastifyInstance): Promise<void> {
    // Serve files from local storage
    fastify.get('/v1/files/*', async (request: FastifyRequest<{ Params: { '*': string } }>, reply) => {
        const fileKey = request.params['*']

        try {
            const { stream, contentType } = await filesService.getFileStream(fileKey)

            reply
                .header('Content-Type', contentType)
                .header('Cache-Control', 'public, max-age=31536000') // Cache for 1 year
                .send(stream)
        } catch (error) {
            reply.code(404).send({ error: 'File not found' })
        }
    })
}
