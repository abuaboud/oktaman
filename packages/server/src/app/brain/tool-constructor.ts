import { Tool } from 'ai';
import { LocalSandbox } from './local-sandbox';
import { SessionSource } from '@oktaman/shared';
import { Composio } from '@composio/core';
import { VercelProvider } from '@composio/vercel';
import { COMPOSIO_API_KEY } from '../common/system';
import { createExecuteBashTool } from './tools/execute-bash';
import { createDisplayAttachmentsTool } from './tools/display-attachments';
import { createPlanningTools } from './tools/planning';
import { createAskQuestionTool } from './tools/ask-question';
import { createAgentTools } from './tools/agent';
import { createFirecrawlTools } from './tools/firecrawl';

// Tool Name Enum
export enum ToolName {
    EXECUTE_BASH = 'execute_bash',
    DISPLAY_ATTACHMENTS = 'display_attachments',
    ASK_QUESTION = 'ask_question',
    WRITE_TODOS = 'write_todos',
    READ_TODOS = 'read_todos',
    MEMORY_SEARCH = 'memory_search',
    MEMORY_STORE = 'memory_store',
    MEMORY_FORGET = 'memory_forget',
    CREATE_AGENT = 'create_agent',
    UPDATE_AGENT = 'update_agent',
    LIST_AGENTS = 'list_agents',
    LIST_COMPOSIO_TRIGGERS = 'list_composio_triggers',
    FIRECRAWL_SCRAPE = 'firecrawl_scrape',
    FIRECRAWL_SEARCH = 'firecrawl_search',
    FIRECRAWL_CRAWL = 'firecrawl_crawl',
    FIRECRAWL_BATCH_SCRAPE = 'firecrawl_batch_scrape',
    FIRECRAWL_EXTRACT = 'firecrawl_extract',
}

// Mapping of tools excluded for each session source
export const excludedToolsBySource: Record<SessionSource, ToolName[]> = {
    [SessionSource.MAIN]: [
        ToolName.MEMORY_SEARCH,
        ToolName.MEMORY_STORE,
        ToolName.MEMORY_FORGET,
    ],
    [SessionSource.TELEGRAM]: [
        ToolName.DISPLAY_ATTACHMENTS,
        ToolName.ASK_QUESTION,
        ToolName.WRITE_TODOS,
        ToolName.READ_TODOS,
        ToolName.MEMORY_SEARCH,
        ToolName.MEMORY_STORE,
        ToolName.MEMORY_FORGET,
    ],
    [SessionSource.AUTOMATION]: [
        ToolName.MEMORY_SEARCH,
        ToolName.MEMORY_STORE,
        ToolName.MEMORY_FORGET,
    ],
};

export type ToolConstructorConfig = {
    sandbox: LocalSandbox;
    sessionId: string;
    sessionSource: SessionSource;
}

export async function constructTools(config: ToolConstructorConfig): Promise<Record<string, Tool>> {
    const {
        sandbox,
        sessionId,
        sessionSource,
    } = config;

    const allTools: Record<string, Tool> = {};
    const excludedTools = excludedToolsBySource[sessionSource] || [];

    // TODO: We have to use our own auth configs for composio
    // composioAuthConfig: packages/server/src/app/brain/composio-auth-config.ts
    // Use a default entity ID for single-tenant mode
    const composio = new Composio({ provider: new VercelProvider(), apiKey: COMPOSIO_API_KEY });
    const composioSession = await composio.create('default-user', {
        authConfigs: undefined,
        toolkits: {
            disable: ['OPENAI', 'ANTHROPIC_ADMINISTRATOR', 'COMPOSIO_SEARCH', 'CODEINTERPRETER',
                'AMBIENT_WEATHER', 'OPENWEATHER_API', 'STORMGLASS_IO', 'AMBEE', 'WEATHERMAP', 'HERE', 'CORRENTLY', 'APIVERVE'
            ]
        },
    });
    const composioTools = await composioSession.tools();

    // Helper function to check if a tool should be included
    function shouldIncludeTool(toolName: ToolName): boolean {
        return !excludedTools.includes(toolName);
    }

    // Execute Bash Tool
    if (shouldIncludeTool(ToolName.EXECUTE_BASH)) {
        Object.assign(allTools, createExecuteBashTool(sandbox));
    }

    // Display Attachments Tool
    if (shouldIncludeTool(ToolName.DISPLAY_ATTACHMENTS)) {
        Object.assign(allTools, createDisplayAttachmentsTool(sandbox));
    }

    // Ask Question Tool
    if (shouldIncludeTool(ToolName.ASK_QUESTION)) {
        Object.assign(allTools, createAskQuestionTool(sessionId));
    }

    // Planning Tools (write_todos, read_todos)
    if (shouldIncludeTool(ToolName.WRITE_TODOS) || shouldIncludeTool(ToolName.READ_TODOS)) {
        const planningTools = createPlanningTools(sessionId);

        if (shouldIncludeTool(ToolName.WRITE_TODOS)) {
            allTools[ToolName.WRITE_TODOS] = planningTools[ToolName.WRITE_TODOS];
        }

        if (shouldIncludeTool(ToolName.READ_TODOS)) {
            allTools[ToolName.READ_TODOS] = planningTools[ToolName.READ_TODOS];
        }
    }

    // Agent Tools
    if (shouldIncludeTool(ToolName.CREATE_AGENT) ||
        shouldIncludeTool(ToolName.UPDATE_AGENT) ||
        shouldIncludeTool(ToolName.LIST_AGENTS) ||
        shouldIncludeTool(ToolName.LIST_COMPOSIO_TRIGGERS)) {
        const agentTools = createAgentTools();

        if (shouldIncludeTool(ToolName.CREATE_AGENT)) {
            allTools[ToolName.CREATE_AGENT] = agentTools[ToolName.CREATE_AGENT];
        }

        if (shouldIncludeTool(ToolName.UPDATE_AGENT)) {
            allTools[ToolName.UPDATE_AGENT] = agentTools[ToolName.UPDATE_AGENT];
        }

        if (shouldIncludeTool(ToolName.LIST_AGENTS)) {
            allTools[ToolName.LIST_AGENTS] = agentTools[ToolName.LIST_AGENTS];
        }

        if (shouldIncludeTool(ToolName.LIST_COMPOSIO_TRIGGERS)) {
            allTools[ToolName.LIST_COMPOSIO_TRIGGERS] = agentTools[ToolName.LIST_COMPOSIO_TRIGGERS];
        }
    }

    // Firecrawl Tools
    const firecrawlTools = await createFirecrawlTools();

    if (shouldIncludeTool(ToolName.FIRECRAWL_SCRAPE) && firecrawlTools[ToolName.FIRECRAWL_SCRAPE]) {
        allTools[ToolName.FIRECRAWL_SCRAPE] = firecrawlTools[ToolName.FIRECRAWL_SCRAPE];
    }

    if (shouldIncludeTool(ToolName.FIRECRAWL_SEARCH) && firecrawlTools[ToolName.FIRECRAWL_SEARCH]) {
        allTools[ToolName.FIRECRAWL_SEARCH] = firecrawlTools[ToolName.FIRECRAWL_SEARCH];
    }

    if (shouldIncludeTool(ToolName.FIRECRAWL_CRAWL) && firecrawlTools[ToolName.FIRECRAWL_CRAWL]) {
        allTools[ToolName.FIRECRAWL_CRAWL] = firecrawlTools[ToolName.FIRECRAWL_CRAWL];
    }

    if (shouldIncludeTool(ToolName.FIRECRAWL_BATCH_SCRAPE) && firecrawlTools[ToolName.FIRECRAWL_BATCH_SCRAPE]) {
        allTools[ToolName.FIRECRAWL_BATCH_SCRAPE] = firecrawlTools[ToolName.FIRECRAWL_BATCH_SCRAPE];
    }

    if (shouldIncludeTool(ToolName.FIRECRAWL_EXTRACT) && firecrawlTools[ToolName.FIRECRAWL_EXTRACT]) {
        allTools[ToolName.FIRECRAWL_EXTRACT] = firecrawlTools[ToolName.FIRECRAWL_EXTRACT];
    }

    // Add Composio tools
    Object.assign(allTools, composioTools);

    return allTools;
}
