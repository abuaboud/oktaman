import { databaseConnection } from '../database/database-connection'
import { AgentEntity } from './agent.entity'
import { Agent, AgentStatus, OktaManError, OktaManErrorCode, spreadIfDefined, apAgentId, AgentTrigger, conversationUtils, isNil, assertNotNullOrUndefined, AGENT_COLOR_NAMES, SessionSource, Session } from '@oktaman/shared'
import dayjs from 'dayjs'
import { sessionService } from '../brain/session/session.service'
import { logger } from '../common/logger'
import { composioService } from './composio/composio.service'
import { schedulerService } from './scheduler/scheduler.service'
import { oktamanService } from '../brain/oktaman.service'
import { settingsService } from '../settings/settings.service'

export const agentRepository = databaseConnection.getRepository<Agent>(AgentEntity)

export const agentService = {
    async getOne(params: GetOneParams): Promise<Agent | null> {
        const { id } = params
        const agent = await agentRepository.findOne({
            where: { id },
        })

        return agent
    },

    async getOneOrThrow(params: GetOneParams): Promise<Agent> {
        const agent = await this.getOne(params)
        if (!agent) {
            throw new OktaManError({
                code: OktaManErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityType: 'agent',
                    entityId: params.id,
                    message: `Agent with id ${params.id} not found`
                }
            });
        }
        return agent
    },

    async list(): Promise<Agent[]> {
        const agents = await agentRepository.find({
            order: {
                updated: 'DESC',
            },
        })

        return agents
    },

    async update(id: string, params: UpdateParams): Promise<Agent> {
        await agentRepository.update(id, {
            ...spreadIfDefined('name', params.name),
            ...spreadIfDefined('description', params.description),
            ...spreadIfDefined('instructions', params.instructions),
            ...spreadIfDefined('status', params.status),
            ...spreadIfDefined('modelId', params.modelId),
        })
        const updatedAgent = await agentRepository.findOneOrFail({ where: { id } })
        return updatedAgent
    },

    async delete(params: DeleteParams): Promise<boolean> {
        const { id } = params
        const agent = await this.getOneOrThrow({ id })

        const trigger = agent.trigger
        switch (trigger.type) {
            case 'composio': {
                assertNotNullOrUndefined(trigger.triggerId, 'Trigger ID is required for composio agents');
                await composioService.deleteTrigger(trigger.triggerId);
                break;
            }
            case 'cron': {
                assertNotNullOrUndefined(trigger.scheduleId, 'Schedule ID is required for cron agents');
                await schedulerService.deleteSchedule(trigger.scheduleId);
                break;
            }
        }
        await agentRepository.remove(agent)
        return true
    },

    async create(params: CreateAgentParams): Promise<Agent> {
        const agentId = params.id ?? apAgentId()
        const randomColor = AGENT_COLOR_NAMES[Math.floor(Math.random() * AGENT_COLOR_NAMES.length)]

        const agent: Agent = {
            id: agentId,
            webhookId: params.webhookId,
            name: params.displayName,
            description: params.description,
            trigger: params.trigger,
            instructions: params.instructions,
            status: AgentStatus.ENABLED,
            modelId: params.modelId ?? (await settingsService.getOrCreate()).defaultModelId,
            color: randomColor,
            created: dayjs().toDate(),
            updated: dayjs().toDate(),
        }

        const savedAgent = await agentRepository.save(agent)

        return savedAgent

    },

    async getOneByWebhookIdOrThrow(webhookId: string): Promise<Agent> {
        const agent = await agentRepository.findOne({
            where: { webhookId },
        })
        if (!agent) {
            throw new OktaManError({
                code: OktaManErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityType: 'agent',
                    entityId: webhookId,
                    message: `Agent with webhook id ${webhookId} not found`
                }
            });
        }
        return agent
    },

    async triggerAgent(params: TriggerAgentParams): Promise<string> {
        const { webhookId, triggerData, isTest = false, sessionId } = params

        const agent = await this.getOneByWebhookIdOrThrow(webhookId)

        logger.info({
            agentId: agent.id,
            agentName: agent.name,
            isTest,
            sessionId: sessionId || 'new'
        }, '🚀 Starting agent trigger processing')

        // Prepare message and instructions
        let userMessage = 'I received new a event that triggered this agent: ' + agent.name
        let instructions = agent.instructions

        if (isTest) {
            // Use agent name and trigger type for meaningful title generation
            userMessage = `Test: ${agent.name} (${agent.trigger.type} trigger)`

            instructions = `${agent.instructions}

---
TEST MODE INSTRUCTIONS:
This is a test execution of the agent. The trigger data provided below is the schema/structure definition, not actual event data.

Your task:
1. Analyze the schema structure provided below
2. Generate realistic sample data that matches this schema
3. Execute the agent instructions above using this simulated data
4. Treat this test as if it were triggered by a real event

Trigger Schema:
${JSON.stringify(triggerData, null, 2)}`
        }

        let session: Session;
        let updatedSession: Session;

        if (sessionId) {
            // Reuse existing session - append to conversation
            session = await sessionService.getOneOrThrow({ id: sessionId })

            updatedSession = await sessionService.update({
                id: session.id,
                conversation: conversationUtils.addUserMessage({
                    conversation: session.conversation,
                    message: userMessage,
                    triggerPayload: {
                        payload: triggerData,
                        triggerName: agent.name,
                    },
                    instructions: instructions,
                }),
                isStreaming: true,
            })
        } else {
            // Create new session
            session = await sessionService.create({
                userMessage: userMessage,
                agentId: agent.id,
                userId: 'system',
                modelId: agent.modelId || (await settingsService.getOrCreate()).defaultModelId,
                source: SessionSource.AUTOMATION,
                isTest: isTest,
            })

            updatedSession = await sessionService.update({
                id: session.id,
                conversation: conversationUtils.addUserMessage({
                    conversation: [],
                    message: userMessage,
                    triggerPayload: {
                        payload: triggerData,
                        triggerName: agent.name,
                    },
                    instructions: instructions,
                }),
                isStreaming: true,
            })
        }

        // Process chat directly (no queue needed)
        oktamanService.chatWithOktaMan(updatedSession, new AbortController().signal).catch((error: unknown) => {
            logger.error({ error, agentId: agent.id, sessionId: updatedSession.id }, 'Failed to process chat')
        })

        logger.info({
            agentId: agent.id,
            sessionId: updatedSession.id,
            webhookId,
            isTest,
            reusingSession: !!sessionId
        }, '✅ Agent trigger processing started')

        return updatedSession.id
    },
}

type DeleteParams = {
    id: string
}

type GetOneParams = {
    id: string
}

type UpdateParams = {
    name?: string
    description?: string
    instructions?: string
    status?: AgentStatus
    modelId?: string
}

type CreateAgentParams = {
    id?: string
    displayName: string
    webhookId: string
    description: string
    instructions: string
    trigger: AgentTrigger
    triggerInput?: Record<string, any>
    modelId?: string
}

type TriggerAgentParams = {
    webhookId: string
    triggerData: any
    isTest?: boolean
    sessionId?: string
}
