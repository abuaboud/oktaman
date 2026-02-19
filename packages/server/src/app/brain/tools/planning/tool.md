# read_todos / write_todos

Track progress on multi-step tasks using todos stored in the current session.

## When to Use

- Tasks requiring 3 or more distinct steps
- Non-trivial and complex tasks
- User explicitly requests a todo list
- User provides multiple tasks to complete
- When demonstrating thoroughness and organization

## Best Practices

- Create todos at the START of complex work
- Update status in REAL-TIME as you progress
- Exactly ONE todo should be 'in_progress' at a time
- Complete current todos before starting new ones
- Remove stale/irrelevant todos by omitting them when writing
- Keep todo descriptions specific and actionable
- Mark tasks complete and start next in a SINGLE write_todos call
- Don't track single operations, trivial tasks, or conversational exchanges

## Parameters

**read_todos:**
- No parameters required

**write_todos:**
- `todos`: Array of todo objects with:
  - `id` (optional): Existing todo ID to preserve timestamps
  - `content` (required): Task description
  - `status` (required): 'pending', 'in_progress', or 'completed'

## Important Notes

- The write_todos list REPLACES the existing todo list entirely
- To remove todos, omit them from the new list
- Preserve IDs when updating existing todos
- Only ONE todo can have status 'in_progress'
