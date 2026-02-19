import { PrincipalType } from "@oktaman/shared";
import { agentService } from "../agent.service";
import { z } from "zod";
import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { logger } from "../../common/logger";
import { getComposio } from "./composio.service";
import { settingsService } from "../../settings/settings.service";

export const composioController: FastifyPluginAsyncZod = async (app) => {
    app.get('/logo/:slug/:type', LogoRequest, async (request, reply) => {
        const { slug, type } = request.params;
        const logoUrl = await getLogoUrl(slug, type);
        if (!logoUrl) {
            return reply.status(404).send({ error: 'Logo not found' });
        }
        const response = await fetch(logoUrl)
        if (!response.ok) {
            logger.warn({ logoUrl, status: response.status }, 'Failed to fetch tool logo')
            return null
        }
        const arrayBuffer = await response.arrayBuffer()
        return reply
            .header('Content-Type', response.headers.get('content-type') || 'image/png')
            .header('Cache-Control', 'public, max-age=86400')
            .send(Buffer.from(arrayBuffer));
    } )

    app.post('/webhook', ComposioWebhookRequest, async (request, reply) => {
        const webhookSecret = await settingsService.getEffectiveApiKey('composio-webhook-secret');
        if (!webhookSecret) {
            logger.error('COMPOSIO_WEBHOOK_SECRET is not configured');
            return reply.status(500).send({ error: 'Webhook secret not configured' });
        }

        const rawBody = request.rawBody as string;
        const composio = await getComposio();
        const { rawPayload, payload } = await composio.triggers.verifyWebhook({
            payload: rawBody,
            signature: request.headers['webhook-signature'] as string,
            id: request.headers['webhook-id'] as string,
            timestamp: request.headers['webhook-timestamp'] as string,
            secret: webhookSecret,
        });

        const webhookId = 'metadata' in rawPayload ? rawPayload.metadata?.trigger_id : undefined;
        if (!webhookId) {
            logger.warn('⚠️ No trigger_id found in webhook payload');
            return reply.status(200).send({
                success: true,
                message: 'No trigger_id found in webhook payload'
            });
        }

        const triggerData = payload.payload ?? payload.originalPayload;
        await agentService.triggerAgent({
            webhookId,
            triggerData,
        });

        return reply.status(200).send({ success: true });

    })
}

async function getLogoUrl(slug: string, type: 'trigger' | 'toolkit') {
    const composio = await getComposio();
    if (type === 'trigger') {
        return composio.triggers.getType(slug).then(trigger => trigger.toolkit.logo);
    }
    return composio.toolkits.get(slug).then(toolkit => toolkit.meta.logo);
}
const LogoRequest = {
    config: {
        allowedPrincipals: [PrincipalType.EVERYONE],
    },
    schema: {
        params: z.object({
            slug: z.string(),
            type: z.enum(['trigger', 'toolkit']),
        }),
    },
}

const ComposioWebhookRequest = {
    config: {
        allowedPrincipals: [PrincipalType.EVERYONE],
        rawBody: true,
    },
    schema: {
        body: z.object({
            type: z.string(),
            timestamp: z.string(),
            data: z.any(),
        }),
    },
}
