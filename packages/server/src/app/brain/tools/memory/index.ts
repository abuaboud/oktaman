import { Tool, tool } from 'ai'
import { z } from 'zod'
import { ProviderConfig } from '@oktaman/shared'
import { memoryBlockService } from '../../../memory-block/memory-block.service'

// Tool names
export const MEMORY_STORE_TOOL_NAME = 'memory_store'
export const MEMORY_SEARCH_TOOL_NAME = 'memory_search'
export const MEMORY_FORGET_TOOL_NAME = 'memory_forget'

// Tool descriptions
const memoryStoreDescription = `
Store important information in long-term memory for this agent.
Use this tool to save facts, preferences, context, or any information that should be remembered across conversations.

Examples of what to store:
- User preferences and settings
- Important facts about the user or project
- Context that should persist between sessions
- Key decisions or outcomes from conversations
- Recurring patterns or workflows

The memory will be associated with the current agent and can be retrieved later using memory_search.
`

const memorySearchDescription = `
Search through the agent's long-term memory for relevant information.
Uses semantic search with embeddings to find the most relevant memories based on the query.

This tool:
- Searches through all stored memories for this agent
- Returns the top 5 most relevant memories ranked by similarity
- Uses semantic matching, not just keyword matching

Use this when:
- You need to recall previously stored information
- You want to check if something was mentioned before
- You need context from past conversations
- Looking for user preferences or patterns
`

const memoryForgetDescription = `
Delete specific memories from the agent's long-term memory.
Permanently removes the specified memory entries.

Use this when:
- User explicitly requests to forget something
- Information is outdated or incorrect
- Need to remove sensitive information
- Cleaning up redundant or obsolete memories

Provide an array of memory IDs to delete.
`

// Input Schemas
const memoryStoreInputSchema = z.object({
    content: z
        .string()
        .describe('The information to store in memory. Should be clear and concise.'),
})

const memorySearchInputSchema = z.object({
    queryString: z
        .string()
        .describe('The search query to find relevant memories'),
})

const memoryForgetInputSchema = z.object({
    ids: z
        .array(z.string())
        .describe('Array of memory IDs to delete'),
})

// Tool creator
export function createMemoryTools(providerConfig: ProviderConfig): Record<string, Tool> {

    return {
        [MEMORY_STORE_TOOL_NAME]: tool({
            description: memoryStoreDescription,
            inputSchema: memoryStoreInputSchema,
            execute: async ({ content }) => {
                try {
                    const memory = await memoryBlockService.store({
                        content,
                        providerConfig,
                    });

                    return {
                        success: true,
                        id: memory.id,
                        content: memory.content,
                        created: memory.created,
                        message: 'Memory stored successfully',
                    }
                } catch (error) {
                    return {
                        success: false,
                        error: `Failed to store memory: ${error}`,
                    }
                }
            },
        }),
        [MEMORY_SEARCH_TOOL_NAME]: tool({
            description: memorySearchDescription,
            inputSchema: memorySearchInputSchema,
            execute: async ({ queryString }) => {
                try {
                    const memories = await memoryBlockService.search({
                        queryString,
                        providerConfig,
                    });

                    return {
                        success: true,
                        memories: memories.map(m => ({
                            id: m.id,
                            content: m.content,
                            created: m.created,
                            score: m.score,
                        })),
                        count: memories.length,
                    }
                } catch (error) {
                    return {
                        success: false,
                        error: `Failed to search memories: ${error}`,
                        memories: [],
                    }
                }
            },
        }),
        [MEMORY_FORGET_TOOL_NAME]: tool({
            description: memoryForgetDescription,
            inputSchema: memoryForgetInputSchema,
            execute: async ({ ids }) => {
                try {
                    await memoryBlockService.forget({ ids });

                    return {
                        success: true,
                        deletedCount: ids.length,
                        message: `Successfully deleted ${ids.length} memory(ies)`,
                    }
                } catch (error) {
                    return {
                        success: false,
                        error: `Failed to delete memories: ${error}`,
                    }
                }
            },
        }),
    }
}
