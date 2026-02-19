
import { Agent, UpdateAgentRequest as UpdateAgentRequestSchema, ListAgentsRequestQueryParams, CreateAgentRequest, conversationUtils, AgentStatus, OktaManErrorCode, OktaManError, assertNotNullOrUndefined } from '@oktaman/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { agentService } from './agent.service'
import { z } from 'zod'
import { composioService } from './composio/composio.service'
import { schedulerService } from './scheduler/scheduler.service'

export const agentController: FastifyPluginAsyncZod = async (app) => {
    app.get('/', ListAgentsRequest, async (request) => {
        return agentService.list();
    })

    app.get('/:id', GetAgentRequest, async (request) => {
        const agent = await agentService.getOneOrThrow({ id: request.params.id });
        return agent;
    })

    app.patch('/:id', UpdateAgentRequest, async (request) => {
        const agent = await agentService.getOneOrThrow({ id: request.params.id });
        const updatedAgent = await agentService.update(request.params.id, request.body);

        switch (updatedAgent.trigger.type) {
            case 'cron': {
                assertNotNullOrUndefined(updatedAgent.trigger.scheduleId, 'Schedule ID is required for cron agents');
                await schedulerService.updateScheduleStatus(updatedAgent.trigger.scheduleId, updatedAgent.status);
                break;
            }
            case 'composio': {
                await composioService.updateTriggerStatus(agent.webhookId, updatedAgent.status);
                break;
            }
        }


        return updatedAgent;
    })

    app.delete('/:id', DeleteAgentRequest, async (request) => {
        return agentService.delete({
            id: request.params.id,
        });
    })

    app.post('/:id/test', TestAgentRequest, async (request) => {
        const agent = await agentService.getOneOrThrow({ id: request.params.id });

        let triggerData: any;
        switch (agent.trigger.type) {
            case 'composio': {
                triggerData = await composioService.getTriggerSchema(agent.trigger.slug!);
                break;
            }
            case 'webhook': {
                triggerData = { test: true, triggeredAt: new Date().toISOString() };
                break;
            }
        }

        const sessionId = await agentService.triggerAgent({
            webhookId: agent.webhookId,
            triggerData,
            isTest: true,
            sessionId: request.body.sessionId,
        });

        return {
            sessionId,
        };
    })

    app.post('/', CreateAgentRequestConfig, async (request) => {
        return agentService.create(request.body);
    })
}

const ListAgentsRequest = {
    schema: {
        querystring: ListAgentsRequestQueryParams,
        response: {
            200: z.array(Agent),
        },
    },
}

const GetAgentRequest = {
    schema: {
        params: z.object({
            id: z.string(),
        }),
        response: {
            200: Agent.nullable(),
        },
    },
}

const UpdateAgentRequest = {
    schema: {
        params: z.object({
            id: z.string(),
        }),
        body: UpdateAgentRequestSchema,
        response: {
            200: Agent.nullable(),
        },
    },
}

const DeleteAgentRequest = {
    schema: {
        params: z.object({
            id: z.string(),
        }),
    },
}

const TestAgentRequest = {
    schema: {
        params: z.object({
            id: z.string(),
        }),
        body: z.object({
            sessionId: z.string().optional(),
        }),
        response: {
            200: z.object({
                sessionId: z.string(),
            }),
        },
    },
}

const CreateAgentRequestConfig = {
    schema: {
        body: CreateAgentRequest,
        response: {
            200: z.any(),
        },
    },
}