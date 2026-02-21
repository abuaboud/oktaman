import { ToolCallConversationMessage } from './conversation';

const TOOL_LABELS: Record<string, ToolLabelConfig> = {
  execute_bash: {
    labelInProgress: 'Using computer...',
    labelCompleted: 'Executed command',
    labelFailed: 'Command failed',
  },
  search_trigger: {
    labelInProgress: 'Searching for triggers',
    labelCompleted: 'Found triggers',
    labelFailed: 'Trigger search failed',
  },
  search_tools: {
    labelInProgress: 'Searching for tools',
    labelCompleted: 'Found tools',
    labelFailed: 'Tool search failed',
  },
  create_agent: {
    labelInProgress: 'Creating agent',
    labelCompleted: 'Agent created',
    labelFailed: 'Agent creation failed',
  },
  list_connections: {
    labelInProgress: 'Loading connections',
    labelCompleted: 'Loaded connections',
    labelFailed: 'Failed to load connections',
  },
  list_composio_triggers: {
    labelInProgress: 'Exploring triggers',
    labelCompleted: 'Explored triggers',
    labelFailed: 'Failed to explore triggers',
  },
  update_agent: {
    labelInProgress: 'Updating agent',
    labelCompleted: 'Agent updated',
    labelFailed: 'Agent update failed',
  },
  list_agents: {
    labelInProgress: 'Loading agents',
    labelCompleted: 'Loaded agents',
    labelFailed: 'Failed to load agents',
  },
  memory_store: {
    labelInProgress: 'Storing memory',
    labelCompleted: 'Memory stored',
    labelFailed: 'Failed to store memory',
  },
  memory_search: {
    labelInProgress: 'Searching memory',
    labelCompleted: 'Memory searched',
    labelFailed: 'Memory search failed',
  },
  memory_forget: {
    labelInProgress: 'Forgetting memory',
    labelCompleted: 'Memory forgotten',
    labelFailed: 'Failed to forget memory',
  },
  write_todos: {
    labelInProgress: 'Updating task list',
    labelCompleted: 'Task list updated',
    labelFailed: 'Failed to update task list',
  },
  read_todos: {
    labelInProgress: 'Reading task list',
    labelCompleted: 'Task list read',
    labelFailed: 'Failed to read task list',
  },
  ask_question: {
    labelInProgress: 'Thinking of a question…',
    labelCompleted: 'Question asked',
    labelFailed: 'Failed to ask question',
  },
  COMPOSIO_SEARCH_TOOLS: {
    labelInProgress: 'Discovering tools across apps',
    labelCompleted: 'Tools discovered',
    labelFailed: 'Tool discovery failed',
  },
  COMPOSIO_MANAGE_CONNECTIONS: {
    labelInProgress: 'Checking connections',
    labelCompleted: 'Checked connections',
    labelFailed: 'Failed to check connections',
  },
  COMPOSIO_MULTI_EXECUTE_TOOL: {
    labelInProgress: 'Executing tools in parallel',
    labelCompleted: 'Tools executed',
    labelFailed: 'Tool execution failed',
  },
  COMPOSIO_REMOTE_WORKBENCH: {
    labelInProgress: 'Running Python code',
    labelCompleted: 'Python code executed',
    labelFailed: 'Python execution failed',
  },
  COMPOSIO_REMOTE_BASH_TOOL: {
    labelInProgress: 'Executing bash commands',
    labelCompleted: 'Bash commands executed',
    labelFailed: 'Bash execution failed',
  },
  COMPOSIO_GET_TOOL_SCHEMAS: {
    labelInProgress: 'Finding available tools',
    labelCompleted: 'Tools found',
    labelFailed: 'Failed to find tools',
  },
  firecrawl_search: {
    labelInProgress: 'Searching the web',
    labelCompleted: 'Web search completed',
    labelFailed: 'Web search failed',
  },
  firecrawl_scrape: {
    labelInProgress: 'Scraping website',
    labelCompleted: 'Website scraped',
    labelFailed: 'Scraping failed',
  },
  firecrawl_crawl: {
    labelInProgress: 'Crawling website',
    labelCompleted: 'Website crawled',
    labelFailed: 'Crawling failed',
  },
  firecrawl_batch_scrape: {
    labelInProgress: 'Batch scraping pages',
    labelCompleted: 'Batch scraping completed',
    labelFailed: 'Batch scraping failed',
  },
  firecrawl_extract: {
    labelInProgress: 'Extracting data',
    labelCompleted: 'Data extracted',
    labelFailed: 'Data extraction failed',
  },
};

function extractPreviewInfo(message: ToolCallConversationMessage): string | null {
  const input = message.input;
  if (!input) return null;

  // For tools with a thought field, show it
  if (
    (message.toolName === 'execute_bash' ||
      message.toolName === 'update_agent' ||
      message.toolName === 'COMPOSIO_REMOTE_WORKBENCH' ||
      message.toolName === 'list_composio_triggers') &&
    input['thought']
  ) {
    const thought = input['thought'] as string;
    return thought.length > 80 ? thought.substring(0, 80) + '...' : thought;
  }

  // For COMPOSIO_MULTI_EXECUTE_TOOL, show thought or summarize tools
  if (message.toolName === 'COMPOSIO_MULTI_EXECUTE_TOOL') {
    if (input['thought']) {
      const thought = input['thought'] as string;
      return thought.length > 80 ? thought.substring(0, 80) + '...' : thought;
    }
    if (input['tools'] && Array.isArray(input['tools'])) {
      const tools = input['tools'] as Array<{ tool_slug?: string; arguments?: Record<string, unknown> }>;
      if (tools.length > 0) {
        const firstTool = tools[0];
        if (firstTool.tool_slug) {
          let preview = firstTool.tool_slug.replace('COMPOSIO_', '').replace(/_/g, ' ').toLowerCase();
          if (firstTool.arguments?.['query']) {
            const query = firstTool.arguments['query'] as string;
            const truncatedQuery = query.length > 30 ? query.substring(0, 30) + '...' : query;
            preview = `${preview}: "${truncatedQuery}"`;
          }
          if (tools.length > 1) {
            preview = `${preview} and ${tools.length - 1} more`;
          }
          return preview;
        }
      }
    }
  }

  // For COMPOSIO_MANAGE_CONNECTIONS, show which toolkits
  if (message.toolName === 'COMPOSIO_MANAGE_CONNECTIONS' && input['toolkits']) {
    const toolkits = input['toolkits'] as string[];
    if (toolkits.length > 0) {
      return toolkits.length === 1
        ? toolkits[0]
        : `${toolkits[0]} and ${toolkits.length - 1} more`;
    }
  }

  // For COMPOSIO_SEARCH_TOOLS, show use cases
  if (message.toolName === 'COMPOSIO_SEARCH_TOOLS' && input['queries']) {
    const queries = input['queries'] as Array<{ use_case?: string }>;
    if (queries.length > 0) {
      const useCases = queries.filter(q => q.use_case).map(q => q.use_case);
      if (useCases.length === 1) return useCases[0]!;
      if (useCases.length > 1) return `${useCases[0]} and ${useCases.length - 1} more`;
    }
  }

  // For ask_question, show the question text
  if (message.toolName === 'ask_question' && input['questions']) {
    const questions = input['questions'] as Array<{ text?: string }>;
    if (questions.length > 0 && questions[0].text) {
      const question = questions[0].text;
      if (questions.length === 1) {
        return question.length > 60 ? question.substring(0, 60) + '...' : question;
      }
      const truncated = question.length > 50 ? question.substring(0, 50) + '...' : question;
      return `${truncated} and ${questions.length - 1} more`;
    }
  }

  // For COMPOSIO_GET_TOOL_SCHEMAS, show tool slugs from output
  if (message.toolName === 'COMPOSIO_GET_TOOL_SCHEMAS' && message.output?.['tool_schemas']) {
    const toolSchemas = message.output['tool_schemas'] as Record<string, { tool_slug?: string }>;
    const toolSlugs = Object.values(toolSchemas).map(schema => schema.tool_slug).filter(Boolean);
    if (toolSlugs.length === 1) return toolSlugs[0]!;
    if (toolSlugs.length > 1) return `${toolSlugs[0]} and ${toolSlugs.length - 1} more`;
  }

  // For firecrawl_search, show the query
  if (message.toolName === 'firecrawl_search' && input['query']) {
    const query = input['query'] as string;
    return query.length > 60 ? query.substring(0, 60) + '...' : query;
  }

  // For firecrawl tools with URL
  if (
    (message.toolName === 'firecrawl_scrape' ||
      message.toolName === 'firecrawl_crawl' ||
      message.toolName === 'firecrawl_extract') &&
    input['url']
  ) {
    const url = input['url'] as string;
    return url.length > 60 ? url.substring(0, 60) + '...' : url;
  }

  // For firecrawl_batch_scrape, show URLs count
  if (message.toolName === 'firecrawl_batch_scrape' && input['urls']) {
    const urls = input['urls'] as string[];
    if (urls.length === 1) {
      const url = urls[0];
      return url.length > 60 ? url.substring(0, 60) + '...' : url;
    }
    return `${urls.length} URLs`;
  }

  // For any tool with queryString
  if (input['queryString']) {
    const queryString = input['queryString'] as string;
    return queryString.length > 60 ? queryString.substring(0, 60) + '...' : queryString;
  }

  return null;
}

export function getToolCallLabel(message: ToolCallConversationMessage): ToolCallLabel {
  const isCompleted = message.status === 'completed';
  const isError = message.status === 'error';

  const toolConfig = TOOL_LABELS[message.toolName];
  const previewInfo = extractPreviewInfo(message);

  if (toolConfig) {
    let baseLabel = isError
      ? toolConfig.labelFailed
      : isCompleted
        ? toolConfig.labelCompleted
        : toolConfig.labelInProgress;

    // Tools that replace baseLabel entirely with the thought/preview
    const thoughtOnlyTools = [
      'COMPOSIO_MULTI_EXECUTE_TOOL',
      'list_composio_triggers',
      'COMPOSIO_REMOTE_WORKBENCH',
      'execute_bash',
      'update_agent',
    ];

    if (thoughtOnlyTools.includes(message.toolName) && previewInfo) {
      return { baseLabel: previewInfo, previewInfo: null };
    }

    // Tools that override baseLabel to be more specific with preview
    const overrideMap: Record<string, { inProgress: string; completed: string; failed: string }> = {
      COMPOSIO_SEARCH_TOOLS: { inProgress: 'Discovering tools for', completed: 'Discovered tools for', failed: 'Failed to discover tools for' },
      COMPOSIO_MANAGE_CONNECTIONS: { inProgress: 'Checking connections for', completed: 'Checked connections for', failed: 'Failed to check connections for' },
      ask_question: { inProgress: 'Asking', completed: 'Asked', failed: 'Failed to ask' },
      firecrawl_search: { inProgress: 'Searching for', completed: 'Searched for', failed: 'Failed to search for' },
      firecrawl_scrape: { inProgress: 'Scraping', completed: 'Scraped', failed: 'Failed to scrape' },
      firecrawl_crawl: { inProgress: 'Crawling', completed: 'Crawled', failed: 'Failed to crawl' },
      firecrawl_batch_scrape: { inProgress: 'Scraping', completed: 'Scraped', failed: 'Failed to scrape' },
      firecrawl_extract: { inProgress: 'Extracting from', completed: 'Extracted from', failed: 'Failed to extract from' },
    };

    const override = overrideMap[message.toolName];
    if (override && previewInfo) {
      baseLabel = isError ? override.failed : isCompleted ? override.completed : override.inProgress;
    }

    return { baseLabel, previewInfo };
  }

  const baseLabel = isError
    ? `${message.toolName} failed`
    : isCompleted
      ? `Used ${message.toolName}`
      : `Using ${message.toolName}`;

  return { baseLabel, previewInfo };
}

export function getToolCallLabelText(message: ToolCallConversationMessage): string {
  const { baseLabel, previewInfo } = getToolCallLabel(message);
  if (previewInfo) {
    return `${baseLabel} "${previewInfo}"`;
  }
  return baseLabel;
}

export { TOOL_LABELS };

export type ToolLabelConfig = {
  labelInProgress: string;
  labelCompleted: string;
  labelFailed: string;
};

export type ToolCallLabel = {
  baseLabel: string;
  previewInfo: string | null;
};
