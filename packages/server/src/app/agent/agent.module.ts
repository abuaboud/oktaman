import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { agentController } from './agent.controller'
import { composioController } from './composio/composio.controller'
import { webhookController } from './webhook.controller'

export const agentModule: FastifyPluginAsyncZod = async (app) => {
    app.register(agentController, { prefix: '/v1/agents' })
    app.register(composioController, { prefix: '/v1/composio' })
    app.register(webhookController, { prefix: '/v1/webhooks' })
}
