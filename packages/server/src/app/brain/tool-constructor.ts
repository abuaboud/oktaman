import { Tool } from 'ai';
import { LocalSandbox } from './local-sandbox';
import { SessionSource, tryCatch } from '@oktaman/shared';
import { Composio } from '@composio/core';
import { VercelProvider } from '@composio/vercel';
import { logger } from '../common/logger';
import { settingsService } from '../settings/settings.service';
import { createExecuteBashTool } from './tools/execute-bash';
import { createPlanningTools } from './tools/planning';
import { createAskQuestionTool } from './tools/ask-question';
import { createAgentTools } from './tools/agent';
import { createFirecrawlTools } from './tools/firecrawl';

// Tool Name Enum
export enum ToolName {
    EXECUTE_BASH = 'execute_bash',
    ASK_QUESTION = 'ask_question',
    WRITE_TODOS = 'write_todos',
    READ_TODOS = 'read_todos',
    MEMORY_SEARCH = 'memory_search',
    MEMORY_STORE = 'memory_store',
    MEMORY_FORGET = 'memory_forget',
    UPSERT_AGENT = 'upsert_agent',
    DELETE_AGENT = 'delete_agent',
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

export async function constructTools(config: ToolConstructorConfig): Promise<ConstructToolsResult> {
    const {
        sandbox,
        sessionId,
        sessionSource,
    } = config;

    const allTools: Record<string, Tool> = {};
    const excludedTools = [...(excludedToolsBySource[sessionSource] || [])];

    // TODO: We have to use our own auth configs for composio
    // composioAuthConfig: packages/server/src/app/brain/composio-auth-config.ts
    // Use a default entity ID for single-tenant mode
    const composioTools = await buildComposioTools();

    // If no Composio tools available, exclude Composio-related tools from prompt
    if (Object.keys(composioTools).length === 0) {
        excludedTools.push(ToolName.LIST_COMPOSIO_TRIGGERS);
    }

    // Helper function to check if a tool should be included
    function shouldIncludeTool(toolName: ToolName): boolean {
        return !excludedTools.includes(toolName);
    }

    // Execute Bash Tool
    if (shouldIncludeTool(ToolName.EXECUTE_BASH)) {
        Object.assign(allTools, createExecuteBashTool(sandbox));
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
    if (shouldIncludeTool(ToolName.UPSERT_AGENT) ||
        shouldIncludeTool(ToolName.DELETE_AGENT) ||
        shouldIncludeTool(ToolName.LIST_AGENTS) ||
        shouldIncludeTool(ToolName.LIST_COMPOSIO_TRIGGERS)) {
        const agentTools = createAgentTools();

        if (shouldIncludeTool(ToolName.UPSERT_AGENT)) {
            allTools[ToolName.UPSERT_AGENT] = agentTools[ToolName.UPSERT_AGENT];
        }

        if (shouldIncludeTool(ToolName.DELETE_AGENT)) {
            allTools[ToolName.DELETE_AGENT] = agentTools[ToolName.DELETE_AGENT];
        }

        if (shouldIncludeTool(ToolName.LIST_AGENTS)) {
            allTools[ToolName.LIST_AGENTS] = agentTools[ToolName.LIST_AGENTS];
        }

        if (shouldIncludeTool(ToolName.LIST_COMPOSIO_TRIGGERS)) {
            allTools[ToolName.LIST_COMPOSIO_TRIGGERS] = agentTools[ToolName.LIST_COMPOSIO_TRIGGERS];
        }
    }

    // Firecrawl Tools
    const firecrawlTools = await buildFirecrawlTools();

    if (Object.keys(firecrawlTools).length === 0) {
        excludedTools.push(
            ToolName.FIRECRAWL_SCRAPE,
            ToolName.FIRECRAWL_SEARCH,
            ToolName.FIRECRAWL_CRAWL,
            ToolName.FIRECRAWL_BATCH_SCRAPE,
            ToolName.FIRECRAWL_EXTRACT,
        );
    } else {
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
    }

    // Add Composio tools
    Object.assign(allTools, composioTools);

    return { tools: allTools, excludedTools };
}

async function buildFirecrawlTools(): Promise<Record<string, Tool>> {
    const firecrawlApiKey = await settingsService.getEffectiveApiKey('firecrawl');
    if (!firecrawlApiKey) {
        logger.info('[ToolConstructor] No Firecrawl API key configured, skipping Firecrawl tools');
        return {};
    }

    process.env.FIRECRAWL_API_KEY = firecrawlApiKey;

    const [error, tools] = await tryCatch(createFirecrawlTools());
    if (error) {
        logger.warn({ error }, '[ToolConstructor] Failed to initialize Firecrawl tools, continuing without them');
        return {};
    }
    return tools;
}

async function buildComposioTools(): Promise<Record<string, Tool>> {
    const composioApiKey = await settingsService.getEffectiveApiKey('composio');
    if (!composioApiKey) {
        logger.info('[ToolConstructor] No Composio API key configured, skipping Composio tools');
        return {};
    }

    const [error, tools] = await tryCatch(initComposioTools(composioApiKey));
    if (error) {
        logger.warn({ error }, '[ToolConstructor] Failed to initialize Composio tools, continuing without them');
        return {};
    }
    return tools;
}

async function initComposioTools(apiKey: string): Promise<Record<string, Tool>> {
    const composio = new Composio({ provider: new VercelProvider(), apiKey });
    const composioSession = await composio.create('default-user', {
        authConfigs: undefined,
        toolkits: {
            disable: ['OPENAI', 'ANTHROPIC_ADMINISTRATOR', 'COMPOSIO_SEARCH', 'CODEINTERPRETER', 'IQAIR_AIRVISUAL',
                'AMBIENT_WEATHER', 'OPENWEATHER_API', 'STORMGLASS_IO', 'AMBEE', 'WEATHERMAP', 'HERE', 'CORRENTLY', 'APIVERVE'
            ]
        },
    });
    return composioSession.tools();
}

type ConstructToolsResult = {
    tools: Record<string, Tool>;
    excludedTools: ToolName[];
}
