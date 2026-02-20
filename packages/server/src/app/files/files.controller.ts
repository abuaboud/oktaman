import { FastifyInstance, FastifyRequest } from 'fastify'
import { filesService } from './files.service'
import { attachmentFileService } from './attachment-file.service'

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

    // Serve attachment files from the working directory by local path
    fastify.get('/v1/attachments/view', async (request: FastifyRequest<{ Querystring: { path: string } }>, reply) => {
        const filePath = request.query.path

        if (!filePath) {
            return reply.code(400).send({ error: 'Missing path query parameter' })
        }

        const result = attachmentFileService.resolveAndValidate(filePath)

        if (!result.valid) {
            return reply.code(403).send({ error: result.error })
        }

        try {
            const { stream, contentType } = await attachmentFileService.getFileStream(result.resolvedPath)

            reply
                .header('Content-Type', contentType)
                .header('Cache-Control', 'public, max-age=3600') // Cache for 1 hour
                .send(stream)
        } catch (error) {
            reply.code(404).send({ error: 'File not found' })
        }
    })
}
