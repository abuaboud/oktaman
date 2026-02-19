# COMPOSIO_MANAGE_CONNECTIONS

## Best Practices

- **NEVER show connection links to the user**—tool displays dialog automatically
- Each call shows a dialog—call again if user requests connection
- Call BEFORE creating Composio agents to verify connections

---

# create_agent

Creates an agent trigger that fires when a specific event occurs (e.g., new email, calendar event, Slack message).

## When to Use

- User wants automated responses to external events
- Setting up notification workflows
- Connecting multiple services with automated actions
- Processing webhooks from third-party services

## Best Practices

**🚨 CRITICAL:  Configuring Trigger Argsas broadly as possible or the agent will break.**

- Do NOT set optional trigger arguments that is keyword search or query.
- Use wide trigger filters—avoid strict matching.
- If in doubt, allow extra events and filter in instructions—not trigger args.


- **🚨 CRITICAL: SEARCH FOR TRIGGERS AT EVERY STAGE**—This is MANDATORY and NON-NEGOTIABLE:
  1. **Initial search**: When user first mentions a task (e.g., search for "churn" triggers)
  2. **RE-SEARCH when ANY detail changes**: If user clarifies HOW they want to detect something (e.g., "via emails", "from Stripe", "in Slack"), IMMEDIATELY search again with that specific service (e.g., `toolkits: ["gmail"]`, `toolkits: ["stripe"]`, `toolkits: ["slack"]`)
  3. **Final search before creating**: Always search one more time right before calling create_agent to verify you have the exact right 
- Gather ALL required information before creating (trigger type, configuration, actions)
- Verify user has necessary connections/integrations set up using composio tool first
- Use specific, detailed instructions—vague instructions lead to unpredictable behavior
- Use exact Composio trigger slugs from list_composio_triggers response (wrong slugs break agents)
- Ask before acting if trigger, config, or behavior is unclear
- Offer webhook as fallback ONLY if specific Composio trigger isn't available after thorough searching


## Additional Important Notes

- Do NOT create agents prematurely—missing information causes failures
- Use ask_question tool when user's request is vague
- Ask for clarification when service mentioned but event type unclear
- Always verify connections exist before creating Composio-based agents

## Naming Guidelines

Create a friendly, short agent name (2-4 words) that:
- Relates directly to the agent's use case or purpose
- Sounds approachable and friendly, yet maintains a professional tone
- Has a subtle creative twist that makes it memorable
- Examples: "Email Digest Assistant", "Weekly Review Buddy", "Invoice Tracker Pro", "Meeting Prep Helper"

## After Creating Agent

** CRITICAL ** After an agent is created, give a brief, plain explanation (one sentence) of what it does. Be friendly and direct, no technical terms, no bullet points, no webhook details. Keep it very short and simple—clarity is critical!

---

# list_composio_triggers

Lists available Composio triggers with their configuration schemas, which are needed to create agents.

## When to Use

- Before creating a Composio-based agent
- User asks what events are available for a specific service
- Need to know what configuration is required for a specific trigger
- User wants to explore agent possibilities for connected services

## Best Practices

- Use this BEFORE creating Composio agents to get the exact slug and required configuration
- Filter by toolkit (e.g., "gmail", "slack") when user mentions a specific service
- Present trigger options clearly to the user so they can choose the right one
- The response includes the complete schema—use it to guide what information to gather from user
- Don't guess trigger slugs—always verify with this tool first

## Important Notes

- All triggers include their configuration schema, which shows what parameters are required
- Use the exact slug from the response when creating agents
- Filter by toolkits to narrow down results when dealing with specific services
- This tool returns ALL available triggers if no filter is provided (can be a long list)

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

