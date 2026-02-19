import { PrincipalType } from '@oktaman/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { agentService } from './agent.service'
import { z } from 'zod'

export const webhookController: FastifyPluginAsyncZod = async (app) => {
    app.all('/:webhookId', WebhookTriggerRequest, async (request, reply) => {
        try {
            const { webhookId } = request.params
            const triggerData = request.body

            await agentService.triggerAgent({
                webhookId,
                triggerData,
            })

            return reply.status(200).send({ success: true })
        } catch (error) {
            return reply.status(500).send({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            })
        }
    })
}

const WebhookTriggerRequest = {
    config: {
        allowedPrincipals: [PrincipalType.EVERYONE],
    },
    schema: {
        params: z.object({
            webhookId: z.string(),
        }),
    },
}