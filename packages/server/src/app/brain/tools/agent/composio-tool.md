# COMPOSIO_MANAGE_CONNECTIONS

## Best Practices

- **NEVER show connection links to the user**—tool displays dialog automatically
- Each call shows a dialog—call again if user requests connection
- Call BEFORE creating Composio agents to verify connections

---

# Composio Agent Creation

When creating agents with Composio triggers, follow these additional guidelines:

## Trigger Configuration

**🚨 CRITICAL:  Configuring Trigger Argsas broadly as possible or the agent will break.**

- Do NOT set optional trigger arguments that is keyword search or query.
- Use wide trigger filters—avoid strict matching.
- If in doubt, allow extra events and filter in instructions—not trigger args.

## Trigger Search

- **🚨 CRITICAL: SEARCH FOR TRIGGERS AT EVERY STAGE**—This is MANDATORY and NON-NEGOTIABLE:
  1. **Initial search**: When user first mentions a task (e.g., search for "churn" triggers)
  2. **RE-SEARCH when ANY detail changes**: If user clarifies HOW they want to detect something (e.g., "via emails", "from Stripe", "in Slack"), IMMEDIATELY search again with that specific service (e.g., `toolkits: ["gmail"]`, `toolkits: ["stripe"]`, `toolkits: ["slack"]`)
  3. **Final search before creating**: Always search one more time right before calling create_agent to verify you have the exact right trigger
- Verify user has necessary connections/integrations set up using composio tool first
- Use exact Composio trigger slugs from list_composio_triggers response (wrong slugs break agents)
- Offer webhook as fallback ONLY if specific Composio trigger isn't available after thorough searching
- Always verify connections exist before creating Composio-based agents

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
