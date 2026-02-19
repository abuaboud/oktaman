# create_agent

Creates an agent trigger that fires when a specific event occurs (e.g., new email, calendar event, Slack message).

## When to Use

- User wants automated responses to external events
- Setting up notification workflows
- Connecting multiple services with automated actions
- Processing webhooks from third-party services

## Best Practices

- Gather ALL required information before creating (trigger type, configuration, actions)
- Use specific, detailed instructions—vague instructions lead to unpredictable behavior
- Ask before acting if trigger, config, or behavior is unclear

## Additional Important Notes

- Do NOT create agents prematurely—missing information causes failures
- Use ask_question tool when user's request is vague
- Ask for clarification when service mentioned but event type unclear

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
- Before updating an agent (to understand current state)
- Need agent IDs or configuration details for other operations

## Best Practices

- Call this BEFORE update_agent to understand the current state
- Filter by specific IDs when you need details about particular agents
- Use this to help users understand what agents they have set up

## Important Notes

- Returns all agents if no IDs are provided
- Each agent includes: id, name, description, instructions, status, trigger configuration
- Use the agent ID from this response when calling update_agent

---

# update_agent

Updates an existing agent's configuration.

## When to Use

- User wants to modify an agent's name, description, or instructions
- User wants to change what an agent does

## Best Practices

- **ALWAYS call list_agents FIRST** to get the current state
- Understand what the agent currently does before making changes
- Only update fields that need to change (all optional except agentId)
- Provide a clear `thought` parameter explaining what changes are being made and why (for UI display)
- Explain what changed after a successful update

## Important Notes

- Cannot update trigger type or configuration—only name, description, and instructions
- To change trigger behavior, update the instructions field
- The `thought` parameter is displayed in the UI to show what's being updated
- **🚨 IMPORTANT: Updating `instructions` fully replaces the old value. Always send the complete, final version you want, not just changes or partial content.**
