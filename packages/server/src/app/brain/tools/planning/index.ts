import { Tool, tool } from 'ai'
import { z } from 'zod'
import { apId, TodoStatus } from '@oktaman/shared'
import { sessionService } from '../../session/session.service'

// Tool names
export const WRITE_TODOS_TOOL_NAME = 'write_todos'
export const READ_TODOS_TOOL_NAME = 'read_todos'

// Tool descriptions
const writeTodosDescription = `
Write and update the todo list for the current session.

Use this tool to:
- Create new todos when starting a complex task
- Update todo status as you progress (pending -> in_progress -> completed)
- Mark todos as completed when finished
- Remove todos that are no longer relevant (by omitting them from the list)

Important:
- Exactly ONE todo should be 'in_progress' at a time
- Keep todos specific and actionable
- The full todo list you provide will replace the existing list

The todos are persisted in the session and displayed to the user in real-time.
`

const readTodosDescription = `
Read the current todo list for the current session.

Use this tool to:
- Check the current state of todos before updating
- Review what tasks are pending, in progress, or completed
- See the full todo list with IDs, content, and status

Returns the complete list of todos with their IDs, content, status, and timestamps.
`

// Input Schemas
const writeTodosInputSchema = z.object({
    todos: z.array(z.object({
        id: z.string().optional().describe('ID of existing todo, omit for new todos'),
        content: z.string().describe('Task description (e.g., "Add feature X")'),
        status: z.enum(['pending', 'in_progress', 'completed']),
    }))
})

const readTodosInputSchema = z.object({})

// Tool creator
export function createPlanningTools(sessionId: string): Record<string, Tool> {
    return {
        [WRITE_TODOS_TOOL_NAME]: tool({
            description: writeTodosDescription,
            inputSchema: writeTodosInputSchema,
            execute: async ({ todos }) => {
                try {
                    // Get current session
                    const session = await sessionService.getOneOrThrow({ id: sessionId });

                    // Validate: only one todo should be in_progress
                    const inProgressCount = todos.filter(t => t.status === 'in_progress').length;
                    if (inProgressCount > 1) {
                        return {
                            success: false,
                            error: 'Only one todo can be in_progress at a time',
                        }
                    }

                    // Transform input todos to full Todo objects
                    const now = new Date();
                    const updatedTodos = todos.map(todo => {
                        // Find existing todo by id to preserve created date
                        const existingTodo = session.todos.find(t => t.id === todo.id);

                        return {
                            id: todo.id || apId(), // Generate new ID if not provided
                            content: todo.content,
                            status: todo.status as TodoStatus,
                            created: existingTodo?.created || now,
                            updated: now,
                        }
                    });

                    // Update session with new todos
                    await sessionService.update({
                        id: sessionId,
                        todos: updatedTodos,
                    });

                    return {
                        success: true,
                        todos: updatedTodos,
                        message: `Successfully updated ${updatedTodos.length} todo(s)`,
                    }
                } catch (error) {
                    return {
                        success: false,
                        error: `Failed to update todos: ${error}`,
                    }
                }
            },
        }),
        [READ_TODOS_TOOL_NAME]: tool({
            description: readTodosDescription,
            inputSchema: readTodosInputSchema,
            execute: async () => {
                try {
                    // Get current session
                    const session = await sessionService.getOneOrThrow({ id: sessionId });

                    return {
                        success: true,
                        todos: session.todos,
                        count: session.todos.length,
                    }
                } catch (error) {
                    return {
                        success: false,
                        error: `Failed to read todos: ${error}`,
                        todos: [],
                    }
                }
            },
        }),
    }
}
