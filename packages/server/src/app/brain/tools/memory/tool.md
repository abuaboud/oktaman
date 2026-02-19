# memory_store / memory_search / memory_forget

Searchable long-term memory for facts that don't belong in your config files.

## Config Files vs. Long-Term Memory

Your config files (`SOUL.MD`, `USER.MD`, `AGENT.MD`) are **always loaded** at the start of every session. They are the source of truth for who you are, who the user is, and how you should behave.

**Use config files for:** identity, personality, user profile, communication preferences, standing rules.
**Use long-term memory for:** project-specific details, one-off facts, IDs, decisions, and contextual knowledge that would clutter the config files.

If something is important enough to always be present, put it in a config file. If it's useful context you may need to recall later, store it as a memory.

## When to Use

- **memory_search**: At the start of every conversation to retrieve relevant context
- **memory_store**: When you learn project details, specific decisions, or facts worth recalling later
- **memory_forget**: When information is outdated or user requests deletion

## Parameters

**memory_store:**
- `content`: Clear, concise description of what to remember

**memory_search:**
- `queryString`: Natural language search query (semantic similarity search)

**memory_forget:**
- `ids`: Array of memory IDs to delete permanently

## Notes

- Semantic search returns up to 5 results with similarity >= 0.5
- Store exactly ONE memory per logical concept
