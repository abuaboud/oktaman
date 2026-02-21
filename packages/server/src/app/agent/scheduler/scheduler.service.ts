import * as cron from 'node-cron'
import { AgentStatus, isNil } from '@oktaman/shared'
import { API_BASE_URL } from '../../common/system'
import { logger } from '../../common/logger'
import { inspect } from 'util'
import { agentRepository } from '../agent.service'

type ScheduledTask = {
    task: cron.ScheduledTask
    agentId: string
    webhookId: string
    cronExpression: string
    enabled: boolean
}

const scheduledTasks = new Map<string, ScheduledTask>()

export const schedulerService = {
    async init(): Promise<void> {
        logger.info('[Scheduler] Cron scheduler initializing...')

        const agents = await agentRepository.findBy({
            status: AgentStatus.ENABLED
        })
        const cronAgents = agents.filter(agent => agent.trigger.type === 'cron' && agent.trigger.cron && agent.trigger.scheduleId)
        for (const agent of cronAgents) {
            await this.createSchedule(
                agent.id,
                agent.trigger.cron!,
                agent.webhookId
            )
        }

        logger.info({
            total: cronAgents.length
        }, '[Scheduler] Cron scheduler initialized')
    },

    async createSchedule(agentId: string, cronExpression: string, webhookId: string): Promise<string> {
        const scheduleId = `cron-${agentId}`

        // Validate cron expression
        if (!cron.validate(cronExpression)) {
            throw new Error(`Invalid cron expression: ${cronExpression}`)
        }

        // Remove existing schedule if it exists
        if (scheduledTasks.has(scheduleId)) {
            await this.deleteSchedule(scheduleId)
        }

        const task = cron.schedule(
            cronExpression,
            async () => {
                logger.info({ agentId, webhookId, scheduleId, cronExpression }, '[Scheduler] Cron job triggered')

                const webhookUrl = `${API_BASE_URL}/api/v1/webhooks/${webhookId}`
                try {
                    const response = await fetch(webhookUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            agentId,
                            source: 'cron',
                            timestamp: new Date().toISOString(),
                        }),
                    })

                    if (!response.ok) {
                        throw new Error(`Webhook returned ${response.status}: ${response.statusText}`)
                    }

                    logger.info({ agentId, scheduleId }, '[Scheduler] Cron job executed successfully')
                } catch (error) {
                    logger.error({ agentId, scheduleId, cronExpression, error: inspect(error) }, '[Scheduler] Cron job failed')
                }
            },
            {
                scheduled: true,
                timezone: 'UTC',
            }
        )

        scheduledTasks.set(scheduleId, {
            task,
            agentId,
            webhookId,
            cronExpression,
            enabled: true,
        })

        logger.info({ agentId, cronExpression, scheduleId }, '[Scheduler] Created cron schedule')
        return scheduleId
    },

    async deleteSchedule(scheduleId: string): Promise<void> {
        const scheduledTask = scheduledTasks.get(scheduleId)

        if (!isNil(scheduledTask)) {
            scheduledTask.task.stop()
            scheduledTasks.delete(scheduleId)
            logger.info({ scheduleId }, '[Scheduler] Deleted cron schedule')
        }
    },

    async updateScheduleStatus(scheduleId: string, status: AgentStatus): Promise<void> {
        const scheduledTask = scheduledTasks.get(scheduleId)

        if (isNil(scheduledTask)) {
            logger.warn({ scheduleId }, '[Scheduler] Schedule not found when updating status')
            return
        }

        if (status === AgentStatus.ENABLED && !scheduledTask.enabled) {
            scheduledTask.task.start()
            scheduledTask.enabled = true
            logger.info({ scheduleId }, '[Scheduler] Resumed cron schedule')
        } else if (status !== AgentStatus.ENABLED && scheduledTask.enabled) {
            scheduledTask.task.stop()
            scheduledTask.enabled = false
            logger.info({ scheduleId }, '[Scheduler] Paused cron schedule')
        }
    },

    async close(): Promise<void> {
        for (const [scheduleId, scheduledTask] of scheduledTasks.entries()) {
            scheduledTask.task.stop()
            logger.debug({ scheduleId }, '[Scheduler] Stopped cron schedule')
        }
        scheduledTasks.clear()
        logger.info('[Scheduler] Cron scheduler closed')
    },
}
