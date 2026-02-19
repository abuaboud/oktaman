import { TriggersTypeListResponse } from '@composio/core'
import { tool, Tool } from 'ai'
import { z } from 'zod'
import { API_BASE_URL } from '../../../common/system'
import { apAgentId, apWebhookId, AgentTrigger, isNil, assertNotNullOrUndefined } from '@oktaman/shared'
import { agentService } from '../../../agent/agent.service'
import { schedulerService } from '../../../agent/scheduler/scheduler.service'
import { getComposio } from '../../../agent/composio/composio.service'


const CREATE_AGENT_TOOL_NAME = 'create_agent'
const CREATE_AGENT_TOOL_DESCRIPTION = `
Create an agent that executes instructions when a trigger event occurs.

CRITICAL - ALWAYS call list_composio_triggers FIRST before creating composio-based agents:
- NEVER create composio agents without calling list_composio_triggers first
- You MUST verify the trigger slug and configuration schema exist before creating
- Call list_composio_triggers with the appropriate toolkit filter to get available triggers
- Use the exact slug and schema from the list_composio_triggers response

IMPORTANT - Configuring Trigger Args:
- Trigger as broadly as possible—avoid strict keyword or exact-match filters in the args configuration.
- Let the agent fire on relevant events, then use the instructions to classify or filter by intent.
- Don't rely on the user's exact wording or precise keywords in trigger filters; capture a wide range of cases so events aren't missed.
- It's better to allow extra events ("false positives") and filter them in the instructions, rather than risk missing relevant events due to narrow filtering.

Required fields:
- trigger: Trigger configuration object
  - type: "webhook", "composio", or "cron"
  - slug: Composio trigger slug (required if type is "composio", e.g., "GMAIL_NEW_GMAIL_MESSAGE")
  - args: Trigger configuration (required if type is "composio") - Configure broadly, avoid strict filters
  - cron: Cron expression (required if type is "cron", e.g., "0 9 * * *" for 9 AM daily, "*/15 * * * *" for every 15 minutes)
- displayName: Human-readable name for the agent
  NAMING GUIDELINES - Create a friendly, short name (2-3 words) that:
  - Relates directly to the agent's use case or purpose
  - Sounds approachable and friendly, yet maintains a professional tone
  - Has a subtle creative twist that makes it memorable
  - Examples: "Email Digest Assistant", "Weekly Review Buddy", "Invoice Tracker Pro", "Meeting Prep Helper"
- description: Brief explanation of what this agent does
- instructions: Detailed instructions for what the agent should do when this trigger fires (including any filtering logic)

Cron Expression Format (for cron triggers):
- Format: "minute hour day month weekday"
- Examples:
  - "0 9 * * *" - Every day at 9 AM
  - "*/15 * * * *" - Every 15 minutes
  - "0 */2 * * *" - Every 2 hours
  - "0 0 * * 1" - Every Monday at midnight
  - "30 14 * * 1-5" - Weekdays at 2:30 PM

For webhook triggers, use the webhookId to create the agent.
`

const CREATE_AGENT_TOOL_INPUT_SCHEMA = z.object({
    trigger: z.object({
        type: z.enum(['webhook', 'composio', 'cron']),
        slug: z.string().optional(),
        args: z.record(z.string(), z.any()).optional(),
        cron: z.string().optional().describe('Cron expression (e.g., "0 9 * * *" for daily at 9 AM)'),
    }),
    displayName: z.string(),
    description: z.string(),
    instructions: z.string(),
})

const LIST_COMPOSIO_TRIGGERS_TOOL_NAME = 'list_composio_triggers'
const LIST_COMPOSIO_TRIGGERS_TOOL_DESCRIPTION = `
Get Composio triggers with their configuration schemas.

All responses include the complete configuration schema needed to create agents.
`
const LIST_COMPOSIO_TRIGGERS_TOOL_SCHEMA = z.object({
    toolkits: z.array(z.string()).optional().describe('Optional array of toolkit names to filter triggers (e.g., ["gmail", "slack"])'),
    thought: z.string().describe('A brief explanation of what triggers are being explored and why'),
})

const UPDATE_AGENT_TOOL_NAME = 'update_agent'
const UPDATE_AGENT_TOOL_DESCRIPTION = `
Update an existing agent's configuration.

IMPORTANT: Before calling this tool, use list_agents to get the current state of the agent.
This allows you to understand what needs to be changed and provide the appropriate updates.

You can update any combination of: name, description, instructions, or status.
Provide the agent ID and the specific fields you want to update.
`
const UPDATE_AGENT_TOOL_SCHEMA = z.object({
    agentId: z.string().describe('The ID of the agent to update'),
    name: z.string().optional().describe('Updated name for the agent'),
    description: z.string().optional().describe('Updated description for the agent'),
    instructions: z.string().optional().describe('Updated instructions for the agent'),
    thought: z.string().optional().describe('A brief explanation of what changes are being made and why'),
})

const LIST_AGENTS_TOOL_NAME = 'list_agents'
const LIST_AGENTS_TOOL_DESCRIPTION = `
List all agents for the current agent.

Optionally filter by specific agent IDs to get detailed information about specific agents.
This is useful for understanding what agents exist and their current configuration.
`
const LIST_AGENTS_TOOL_SCHEMA = z.object({
    ids: z.array(z.string()).optional().describe('Optional array of agent IDs to filter. If not provided, returns all agents.'),
})

export function createAgentTools(): Record<string, Tool> {
    return {
        [CREATE_AGENT_TOOL_NAME]: tool({
            description: CREATE_AGENT_TOOL_DESCRIPTION,
            inputSchema: CREATE_AGENT_TOOL_INPUT_SCHEMA,
            execute: async ({ trigger, displayName, description, instructions }) => {
                const agentId = apAgentId()
                const webhookId = apWebhookId()
                let createdTrigger: AgentTrigger | undefined

                switch (trigger.type) {
                    case 'composio': {
                        createdTrigger = await createComposioAgent(agentId, trigger)
                        break
                    }
                    case 'cron': {
                        assertNotNullOrUndefined(trigger.cron, 'Cron expression is required for cron triggers')
                        createdTrigger = await createCronAgent(agentId, trigger.cron, webhookId)
                        break
                    }
                    case 'webhook': {
                        createdTrigger = {
                            type: 'webhook',
                        }
                        break
                    }
                    default:
                        throw new Error(`Invalid trigger type: ${trigger.type}`)
                }

                const agent = await agentService.create({
                    id: agentId,
                    displayName,
                    webhookId: createdTrigger.triggerId ?? webhookId,
                    description,
                    instructions,
                    trigger: createdTrigger,
                });
                return {
                    ...agent,
                    webhookUrl: `${API_BASE_URL}/api/v1/webhooks/${webhookId}`,
                }
            },
        }),
        [LIST_COMPOSIO_TRIGGERS_TOOL_NAME]: tool({
            description: LIST_COMPOSIO_TRIGGERS_TOOL_DESCRIPTION,
            inputSchema: LIST_COMPOSIO_TRIGGERS_TOOL_SCHEMA,
            execute: async ({ toolkits, thought: _thought }) => {
                const composio = await getComposio();
                const triggers: TriggersTypeListResponse['items'] = []
                let cursor: string | undefined
                do {
                    const response = await composio.triggers.listTypes({
                        toolkits: toolkits,
                        ...(cursor ? { cursor } : {}),
                    })
                    triggers.push(...response.items)
                    cursor = response.nextCursor ?? undefined
                } while (cursor)
                return triggers
            },
        }),
        [UPDATE_AGENT_TOOL_NAME]: tool({
            description: UPDATE_AGENT_TOOL_DESCRIPTION,
            inputSchema: UPDATE_AGENT_TOOL_SCHEMA,
            execute: async ({ agentId, name, description, instructions, thought: _thought }) => {
                return await agentService.update(agentId, {
                    name,
                    description,
                    instructions,
                })
            },
        }),
        [LIST_AGENTS_TOOL_NAME]: tool({
            description: LIST_AGENTS_TOOL_DESCRIPTION,
            inputSchema: LIST_AGENTS_TOOL_SCHEMA,
            execute: async ({ ids }) => {
                const allAgents = await agentService.list()
                return allAgents.filter(agent => isNil(ids) || ids.includes(agent.id))
            },
        }),
    };
}

async function createComposioAgent(agentId: string, trigger: z.infer<typeof CREATE_AGENT_TOOL_INPUT_SCHEMA>['trigger']): Promise<AgentTrigger> {
    const composio = await getComposio();
    const triggerType = await composio.triggers.getType(trigger.slug!)
    if (!triggerType) {
        throw new Error(`Trigger "${trigger.slug}" not found.`)
    }
    // Use a default entity ID for single-tenant mode
    const entityId = 'default-user'
    const { triggerId } = await composio.triggers.create(entityId, trigger.slug!, {
        triggerConfig: {
            ...trigger.args,
            agentId: agentId,
        },
    })
    return {
        type: 'composio',
        slug: trigger.slug,
        triggerId: triggerId,
        args: trigger.args,
    }
}

async function createCronAgent(agentId: string, cron: string, webhookId: string): Promise<AgentTrigger> {
    const scheduleId = await schedulerService.createSchedule(agentId, cron, webhookId)
    return {
        type: 'cron',
        cron: cron,
        scheduleId: scheduleId,
    }
}