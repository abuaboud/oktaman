# upsert_agent

Creates or updates an agent trigger that fires when a specific event occurs (e.g., new email, calendar event, Slack message).

## When to Use

- User wants automated responses to external events
- Setting up notification workflows
- Connecting multiple services with automated actions
- Processing webhooks from third-party services
- User wants to modify an existing agent's name, description, or instructions

## When NOT to Use

- **Never** create an agent for one-off tasks—just do the task directly
- **Never** create an agent without a valid trigger (e.g., a webhook, schedule, or external event)
- Agents are **only** for background automation that is recurring or event-driven
- If the user asks to "do something now", do it immediately—do not create an agent for it

## Best Practices

- Gather ALL required information before creating (trigger type, configuration, actions)
- Use specific, detailed instructions—vague instructions lead to unpredictable behavior
- Ask before acting if trigger, config, or behavior is unclear
- When updating, **ALWAYS call list_agents FIRST** to get the current state
- Only update fields that need to change (pass agentId to update an existing agent)
- **🚨 IMPORTANT: Updating `instructions` fully replaces the old value. Always send the complete, final version you want, not just changes or partial content.**

## Additional Important Notes

- Do NOT create agents prematurely—missing information causes failures
- Use ask_question tool when user's request is vague
- Ask for clarification when service mentioned but event type unclear
- Cannot update trigger type or configuration—only name, description, and instructions
- To change trigger behavior, update the instructions field

## Naming Guidelines

Create a friendly, short agent name (2-4 words) that:
- Relates directly to the agent's use case or purpose
- Sounds approachable and friendly, yet maintains a professional tone
- Has a subtle creative twist that makes it memorable
- Examples: "Email Digest Assistant", "Weekly Review Buddy", "Invoice Tracker Pro", "Meeting Prep Helper"

## After Creating Agent

** CRITICAL ** After an agent is created, give a brief, plain explanation (one sentence) of what it does. Be friendly and direct, no technical terms, no bullet points, no webhook details. Keep it very short and simple—clarity is critical!

---

# list_agents

Lists all agents for the current agent, with optional filtering by agent IDs.

## When to Use

- User asks to see their agents or wants to know what's running
- Before updating or deleting an agent (to understand current state)
- Need agent IDs or configuration details for other operations

## Best Practices

- Call this BEFORE upsert_agent (with agentId) to understand the current state
- Filter by specific IDs when you need details about particular agents
- Use this to help users understand what agents they have set up

## Important Notes

- Returns all agents if no IDs are provided
- Each agent includes: id, name, description, instructions, status, trigger configuration
- Use the agent ID from this response when calling upsert_agent or delete_agent

---

# delete_agent

Permanently deletes an existing agent and cleans up its trigger.

## When to Use

- User wants to remove an agent they no longer need
- User explicitly asks to delete or stop an agent permanently

## Best Practices

- **ALWAYS call list_agents FIRST** to confirm the agent exists and get the correct ID
- Confirm with the user before deleting—this action is irreversible
- Explain what was deleted after a successful deletion

## Important Notes

- This action is permanent and cannot be undone
- The agent's trigger (composio, cron, or webhook) is also cleaned up
- Existing sessions created by the agent are NOT deleted
