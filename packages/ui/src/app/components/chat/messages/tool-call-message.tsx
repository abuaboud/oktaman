import { useState } from 'react';
import {
  Wrench,
  Search,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  Terminal,
  Workflow,
  Brain,
  ListTodo,
  Loader,
  MessageCircleQuestion,
  Link,
  Zap,
  Code,
  FileSearch,
} from 'lucide-react';
import { cn, formatDuration } from '@/lib/utils';
import { Agent, ToolCallConversationMessage } from '@oktaman/shared';
import { AgentCard } from './agent-card';
import { TodoListDisplay } from './todo-list-display';

interface ToolCallMessageProps {
  message: ToolCallConversationMessage;
  className?: string;
  isStopped?: boolean;
}

type ToolConfig = {
  icon: React.ReactNode;
  labelInProgress: string;
  labelCompleted: string;
  labelFailed: string;
  colorClass: string;
};

const TOOL_CONFIGS: Record<string, ToolConfig> = {
  // Bash/Terminal tools
  execute_bash: {
    icon: <Terminal className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />,
    labelInProgress: 'Using computer...',
    labelCompleted: 'Executed command',
    labelFailed: 'Command failed',
    colorClass: 'text-emerald-600 dark:text-emerald-400',
  },

  // Agent tools
  search_trigger: {
    icon: <Workflow className="size-4 shrink-0 text-slate-blue-600 dark:text-slate-blue-400" />,
    labelInProgress: 'Searching for triggers',
    labelCompleted: 'Found triggers',
    labelFailed: 'Trigger search failed',
    colorClass: 'text-slate-blue-600 dark:text-slate-blue-400',
  },
  search_tools: {
    icon: <Wrench className="size-4 shrink-0 text-blue-grey-600 dark:text-blue-grey-400" />,
    labelInProgress: 'Searching for tools',
    labelCompleted: 'Found tools',
    labelFailed: 'Tool search failed',
    colorClass: 'text-blue-grey-600 dark:text-blue-grey-400',
  },
  create_agent: {
    icon: <Workflow className="size-4 shrink-0 text-carrot-orange-600 dark:text-carrot-orange-400" />,
    labelInProgress: 'Creating agent',
    labelCompleted: 'Agent created',
    labelFailed: 'Agent creation failed',
    colorClass: 'text-carrot-orange-600 dark:text-carrot-orange-400',
  },
  list_connections: {
    icon: <Workflow className="size-4 shrink-0 text-blue-grey-600 dark:text-blue-grey-400" />,
    labelInProgress: 'Loading connections',
    labelCompleted: 'Loaded connections',
    labelFailed: 'Failed to load connections',
    colorClass: 'text-blue-grey-600 dark:text-blue-grey-400',
  },

  list_composio_triggers: {
    icon: <Workflow className="size-4 shrink-0 text-slate-blue-600 dark:text-slate-blue-400" />,
    labelInProgress: 'Exploring triggers',
    labelCompleted: 'Explored triggers',
    labelFailed: 'Failed to explore triggers',
    colorClass: 'text-slate-blue-600 dark:text-slate-blue-400',
  },
  update_agent: {
    icon: <Workflow className="size-4 shrink-0 text-carrot-orange-600 dark:text-carrot-orange-400" />,
    labelInProgress: 'Updating agent',
    labelCompleted: 'Agent updated',
    labelFailed: 'Agent update failed',
    colorClass: 'text-carrot-orange-600 dark:text-carrot-orange-400',
  },
  list_agents: {
    icon: <Workflow className="size-4 shrink-0 text-blue-grey-600 dark:text-blue-grey-400" />,
    labelInProgress: 'Loading agents',
    labelCompleted: 'Loaded agents',
    labelFailed: 'Failed to load agents',
    colorClass: 'text-blue-grey-600 dark:text-blue-grey-400',
  },

  // Memory tools
  memory_store: {
    icon: <Brain className="size-4 shrink-0 text-slate-blue-600 dark:text-slate-blue-400" />,
    labelInProgress: 'Storing memory',
    labelCompleted: 'Memory stored',
    labelFailed: 'Failed to store memory',
    colorClass: 'text-slate-blue-600 dark:text-slate-blue-400',
  },
  memory_search: {
    icon: <Brain className="size-4 shrink-0 text-bubblegum-pink-600 dark:text-bubblegum-pink-400" />,
    labelInProgress: 'Searching memory',
    labelCompleted: 'Memory searched',
    labelFailed: 'Memory search failed',
    colorClass: 'text-bubblegum-pink-600 dark:text-bubblegum-pink-400',
  },
  memory_forget: {
    icon: <Brain className="size-4 shrink-0 text-red-600 dark:text-red-400" />,
    labelInProgress: 'Forgetting memory',
    labelCompleted: 'Memory forgotten',
    labelFailed: 'Failed to forget memory',
    colorClass: 'text-red-600 dark:text-red-400',
  },

  // Planning tools
  write_todos: {
    icon: <ListTodo className="size-4 shrink-0 text-royal-gold-600 dark:text-royal-gold-400" />,
    labelInProgress: 'Updating task list',
    labelCompleted: 'Task list updated',
    labelFailed: 'Failed to update task list',
    colorClass: 'text-royal-gold-600 dark:text-royal-gold-400',
  },
  read_todos: {
    icon: <ListTodo className="size-4 shrink-0 text-strong-cyan-600 dark:text-strong-cyan-400" />,
    labelInProgress: 'Reading task list',
    labelCompleted: 'Task list read',
    labelFailed: 'Failed to read task list',
    colorClass: 'text-strong-cyan-600 dark:text-strong-cyan-400',
  },

  // Question tools
  ask_question: {
    icon: <MessageCircleQuestion className="size-4 shrink-0 text-bubblegum-pink-600 dark:text-bubblegum-pink-400" />,
    labelInProgress: 'Thinking of a question…',
    labelCompleted: 'Question asked',
    labelFailed: 'Failed to ask question',
    colorClass: 'text-bubblegum-pink-600 dark:text-bubblegum-pink-400',
  },

  // Composio meta tools
  COMPOSIO_SEARCH_TOOLS: {
    icon: <Search className="size-4 shrink-0 text-blue-grey-600 dark:text-blue-grey-400" />,
    labelInProgress: 'Discovering tools across apps',
    labelCompleted: 'Tools discovered',
    labelFailed: 'Tool discovery failed',
    colorClass: 'text-blue-grey-600 dark:text-blue-grey-400',
  },
  COMPOSIO_MANAGE_CONNECTIONS: {
    icon: <Link className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />,
    labelInProgress: 'Checking connections',
    labelCompleted: 'Checked connections',
    labelFailed: 'Failed to check connections',
    colorClass: 'text-emerald-600 dark:text-emerald-400',
  },
  COMPOSIO_MULTI_EXECUTE_TOOL: {
    icon: <Zap className="size-4 shrink-0 text-carrot-orange-600 dark:text-carrot-orange-400" />,
    labelInProgress: 'Executing tools in parallel',
    labelCompleted: 'Tools executed',
    labelFailed: 'Tool execution failed',
    colorClass: 'text-carrot-orange-600 dark:text-carrot-orange-400',
  },
  COMPOSIO_REMOTE_WORKBENCH: {
    icon: <Code className="size-4 shrink-0 text-slate-blue-600 dark:text-slate-blue-400" />,
    labelInProgress: 'Running Python code',
    labelCompleted: 'Python code executed',
    labelFailed: 'Python execution failed',
    colorClass: 'text-slate-blue-600 dark:text-slate-blue-400',
  },
  COMPOSIO_REMOTE_BASH_TOOL: {
    icon: <Terminal className="size-4 shrink-0 text-strong-cyan-600 dark:text-strong-cyan-400" />,
    labelInProgress: 'Executing bash commands',
    labelCompleted: 'Bash commands executed',
    labelFailed: 'Bash execution failed',
    colorClass: 'text-strong-cyan-600 dark:text-strong-cyan-400',
  },
  COMPOSIO_GET_TOOL_SCHEMAS: {
    icon: <Wrench className="size-4 shrink-0 text-royal-gold-600 dark:text-royal-gold-400" />,
    labelInProgress: 'Finding available tools',
    labelCompleted: 'Tools found',
    labelFailed: 'Failed to find tools',
    colorClass: 'text-royal-gold-600 dark:text-royal-gold-400',
  },

  // Firecrawl tools
  firecrawl_search: {
    icon: <Search className="size-4 shrink-0 text-bubblegum-pink-600 dark:text-bubblegum-pink-400" />,
    labelInProgress: 'Searching the web',
    labelCompleted: 'Web search completed',
    labelFailed: 'Web search failed',
    colorClass: 'text-bubblegum-pink-600 dark:text-bubblegum-pink-400',
  },
  firecrawl_scrape: {
    icon: <Search className="size-4 shrink-0 text-strong-cyan-600 dark:text-strong-cyan-400" />,
    labelInProgress: 'Scraping website',
    labelCompleted: 'Website scraped',
    labelFailed: 'Scraping failed',
    colorClass: 'text-strong-cyan-600 dark:text-strong-cyan-400',
  },
  firecrawl_crawl: {
    icon: <Search className="size-4 shrink-0 text-royal-gold-600 dark:text-royal-gold-400" />,
    labelInProgress: 'Crawling website',
    labelCompleted: 'Website crawled',
    labelFailed: 'Crawling failed',
    colorClass: 'text-royal-gold-600 dark:text-royal-gold-400',
  },
  firecrawl_batch_scrape: {
    icon: <Search className="size-4 shrink-0 text-carrot-orange-600 dark:text-carrot-orange-400" />,
    labelInProgress: 'Batch scraping pages',
    labelCompleted: 'Batch scraping completed',
    labelFailed: 'Batch scraping failed',
    colorClass: 'text-carrot-orange-600 dark:text-carrot-orange-400',
  },
  firecrawl_extract: {
    icon: <FileSearch className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />,
    labelInProgress: 'Extracting data',
    labelCompleted: 'Data extracted',
    labelFailed: 'Data extraction failed',
    colorClass: 'text-emerald-600 dark:text-emerald-400',
  },
};

export function ToolCallMessage({
  message,
  className,
  isStopped = false,
}: ToolCallMessageProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const toolConfig = TOOL_CONFIGS[message.toolName];

  const isCompleted = message.status === 'completed';
  const isLoading = !isStopped && (message.status === 'loading' || message.status === 'ready');
  const isError = message.status === 'error';

  const isCreateAgent = message.toolName === 'create_agent';
  const showAgentCard = isCreateAgent && isCompleted && message.output;

  const isWriteTodos = message.toolName === 'write_todos';
  const showTodoList = isWriteTodos && isCompleted && message.output?.todos;
  

  const getIcon = () => {
    if (toolConfig) {
      return toolConfig.icon;
    }
    return <Wrench className="size-3 text-muted-foreground shrink-0" />;
  };

  const extractPreviewInfo = () => {
    if (!message.input) return null;

    // For execute_bash, show the thought
    if (message.toolName === 'execute_bash' && message.input.thought) {
      const thought = message.input.thought as string;
      return thought.length > 80 ? thought.substring(0, 80) + '...' : thought;
    }

    // For update_agent, show the thought
    if (message.toolName === 'update_agent' && message.input.thought) {
      const thought = message.input.thought as string;
      return thought.length > 80 ? thought.substring(0, 80) + '...' : thought;
    }

    // For COMPOSIO_MULTI_EXECUTE_TOOL, show thought or summarize tools
    if (message.toolName === 'COMPOSIO_MULTI_EXECUTE_TOOL') {
      // First check if there's a thought
      if (message.input.thought) {
        const thought = message.input.thought as string;
        return thought.length > 80 ? thought.substring(0, 80) + '...' : thought;
      }

      // Otherwise, summarize the tools being executed
      if (message.input.tools && Array.isArray(message.input.tools)) {
        const tools = message.input.tools as Array<{ tool_slug?: string; arguments?: any }>;
        if (tools.length > 0) {
          // Try to extract meaningful info from the first tool
          const firstTool = tools[0];
          if (firstTool.tool_slug) {
            let preview = firstTool.tool_slug.replace('COMPOSIO_', '').replace(/_/g, ' ').toLowerCase();

            // Add query/search term if available
            if (firstTool.arguments?.query) {
              const query = firstTool.arguments.query as string;
              const truncatedQuery = query.length > 30 ? query.substring(0, 30) + '...' : query;
              preview = `${preview}: "${truncatedQuery}"`;
            }

            // Show count if multiple tools
            if (tools.length > 1) {
              preview = `${preview} and ${tools.length - 1} more`;
            }

            return preview;
          }
        }
      }
    }

    // For COMPOSIO_REMOTE_WORKBENCH, show the thought
    if (message.toolName === 'COMPOSIO_REMOTE_WORKBENCH' && message.input.thought) {
      const thought = message.input.thought as string;
      return thought.length > 80 ? thought.substring(0, 80) + '...' : thought;
    }

    // For list_composio_triggers, show the thought
    if (message.toolName === 'list_composio_triggers' && message.input.thought) {
      const thought = message.input.thought as string;
      return thought.length > 80 ? thought.substring(0, 80) + '...' : thought;
    }

    // For COMPOSIO_MANAGE_CONNECTIONS, show which toolkits are being managed
    if (message.toolName === 'COMPOSIO_MANAGE_CONNECTIONS' && message.input.toolkits) {
      const toolkits = message.input.toolkits as string[];
      if (toolkits.length > 0) {
        if (toolkits.length === 1) {
          return toolkits[0];
        } else {
          return `${toolkits[0]} and ${toolkits.length - 1} more`;
        }
      }
    }

    // For COMPOSIO_SEARCH_TOOLS, show what tools are being discovered
    if (message.toolName === 'COMPOSIO_SEARCH_TOOLS' && message.input.queries) {
      const queries = message.input.queries as Array<{ use_case?: string }>;
      if (queries.length > 0) {
        const useCases = queries
          .filter(q => q.use_case)
          .map(q => q.use_case);

        if (useCases.length === 1) {
          return useCases[0];
        } else if (useCases.length > 1) {
          return `${useCases[0]} and ${useCases.length - 1} more`;
        }
      }
    }

    // For ask_question, show what question is being asked
    if (message.toolName === 'ask_question' && message.input.questions) {
      const questions = message.input.questions as Array<{ text?: string }>;
      if (questions.length > 0 && questions[0].text) {
        const question = questions[0].text;
        // Truncate long questions and show count if multiple
        if (questions.length === 1) {
          return question.length > 60 ? question.substring(0, 60) + '...' : question;
        } else {
          const truncated = question.length > 50 ? question.substring(0, 50) + '...' : question;
          return `${truncated} and ${questions.length - 1} more`;
        }
      }
    }

    // For COMPOSIO_GET_TOOL_SCHEMAS, show which tools were loaded from output
    if (message.toolName === 'COMPOSIO_GET_TOOL_SCHEMAS' && message.output?.tool_schemas) {
      const toolSchemas = message.output.tool_schemas as Record<string, { tool_slug?: string }>;
      const toolSlugs = Object.values(toolSchemas)
        .map(schema => schema.tool_slug)
        .filter(Boolean);

      if (toolSlugs.length === 1) {
        return toolSlugs[0];
      } else if (toolSlugs.length > 1) {
        return `${toolSlugs[0]} and ${toolSlugs.length - 1} more`;
      }
    }

    // For firecrawl_search, show the query
    if (message.toolName === 'firecrawl_search' && message.input.query) {
      const query = message.input.query as string;
      return query.length > 60 ? query.substring(0, 60) + '...' : query;
    }

    // For firecrawl_scrape, show the URL
    if (message.toolName === 'firecrawl_scrape' && message.input.url) {
      const url = message.input.url as string;
      return url.length > 60 ? url.substring(0, 60) + '...' : url;
    }

    // For firecrawl_crawl, show the URL
    if (message.toolName === 'firecrawl_crawl' && message.input.url) {
      const url = message.input.url as string;
      return url.length > 60 ? url.substring(0, 60) + '...' : url;
    }

    // For firecrawl_batch_scrape, show the number of URLs
    if (message.toolName === 'firecrawl_batch_scrape' && message.input.urls) {
      const urls = message.input.urls as string[];
      if (urls.length === 1) {
        const url = urls[0];
        return url.length > 60 ? url.substring(0, 60) + '...' : url;
      } else {
        return `${urls.length} URLs`;
      }
    }

    // For firecrawl_extract, show the URL
    if (message.toolName === 'firecrawl_extract' && message.input.url) {
      const url = message.input.url as string;
      return url.length > 60 ? url.substring(0, 60) + '...' : url;
    }

    // For any tool with queryString, show it
    if (message.input.queryString) {
      const queryString = message.input.queryString as string;
      return queryString.length > 60 ? queryString.substring(0, 60) + '...' : queryString;
    }

    return null;
  };

  const getLabel = () => {
    const previewInfo = extractPreviewInfo();

    if (toolConfig) {
      let baseLabel = isError
        ? toolConfig.labelFailed
        : isCompleted
        ? toolConfig.labelCompleted
        : toolConfig.labelInProgress;

      // For COMPOSIO_MULTI_EXECUTE_TOOL, show just the thought/details without prefix
      if (message.toolName === 'COMPOSIO_MULTI_EXECUTE_TOOL' && previewInfo) {
        return { baseLabel: previewInfo, previewInfo: null };
      }

      // Make COMPOSIO_SEARCH_TOOLS label more specific when we have use cases
      if (message.toolName === 'COMPOSIO_SEARCH_TOOLS' && previewInfo) {
        baseLabel = isError
          ? 'Failed to discover tools for'
          : isCompleted
          ? 'Discovered tools for'
          : 'Discovering tools for';
      }

      // For list_composio_triggers, show just the thought without prefix
      if (message.toolName === 'list_composio_triggers' && previewInfo) {
        return { baseLabel: previewInfo, previewInfo: null };
      }

      // Make COMPOSIO_MANAGE_CONNECTIONS label more specific when we have toolkits
      if (message.toolName === 'COMPOSIO_MANAGE_CONNECTIONS' && previewInfo) {
        baseLabel = isError
          ? 'Failed to check connections for'
          : isCompleted
          ? 'Checked connections for'
          : 'Checking connections for';
      }

      // Make ask_question label more specific when we have the question text
      if (message.toolName === 'ask_question' && previewInfo) {
        baseLabel = isError
          ? 'Failed to ask'
          : isCompleted
          ? 'Asked'
          : 'Asking';
      }

      // For COMPOSIO_REMOTE_WORKBENCH, show just the thought without prefix
      if (message.toolName === 'COMPOSIO_REMOTE_WORKBENCH' && previewInfo) {
        return { baseLabel: previewInfo, previewInfo: null };
      }

      // For execute_bash, show just the thought without prefix
      if (message.toolName === 'execute_bash' && previewInfo) {
        return { baseLabel: previewInfo, previewInfo: null };
      }

      // For update_agent, show just the thought without prefix
      if (message.toolName === 'update_agent' && previewInfo) {
        return { baseLabel: previewInfo, previewInfo: null };
      }

      // For firecrawl_search, make label more specific when we have a query
      if (message.toolName === 'firecrawl_search' && previewInfo) {
        baseLabel = isError
          ? 'Failed to search for'
          : isCompleted
          ? 'Searched for'
          : 'Searching for';
      }

      // For firecrawl_scrape, make label more specific when we have a URL
      if (message.toolName === 'firecrawl_scrape' && previewInfo) {
        baseLabel = isError
          ? 'Failed to scrape'
          : isCompleted
          ? 'Scraped'
          : 'Scraping';
      }

      // For firecrawl_crawl, make label more specific when we have a URL
      if (message.toolName === 'firecrawl_crawl' && previewInfo) {
        baseLabel = isError
          ? 'Failed to crawl'
          : isCompleted
          ? 'Crawled'
          : 'Crawling';
      }

      // For firecrawl_batch_scrape, make label more specific when we have URLs
      if (message.toolName === 'firecrawl_batch_scrape' && previewInfo) {
        baseLabel = isError
          ? 'Failed to scrape'
          : isCompleted
          ? 'Scraped'
          : 'Scraping';
      }

      // For firecrawl_extract, make label more specific when we have a URL
      if (message.toolName === 'firecrawl_extract' && previewInfo) {
        baseLabel = isError
          ? 'Failed to extract from'
          : isCompleted
          ? 'Extracted from'
          : 'Extracting from';
      }

      return { baseLabel, previewInfo };
    }

    const baseLabel = isError
      ? `${message.toolName} failed`
      : isCompleted
      ? `Used ${message.toolName}`
      : `Using ${message.toolName}`;

    return { baseLabel, previewInfo };
  };

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const { baseLabel, previewInfo } = getLabel();
  const duration = formatDuration(message.startedAt, message.completedAt);

  return (
    <div className={cn('text-sm', className)}>
      {!showTodoList && (
        <div className="flex items-center gap-2 py-1">
          {isError ? (
            <AlertCircle className="size-4 shrink-0 text-destructive" />
          ) : isLoading ? (
            <Loader className={cn("size-4 shrink-0 animate-spin", toolConfig?.colorClass || "text-muted-foreground")} />
          ) : (
            getIcon()
          )}
          <span className={cn("font-medium whitespace-nowrap", toolConfig?.colorClass)}>
            {baseLabel}
          </span>
          {previewInfo && (
            <span className={cn("truncate", toolConfig?.colorClass)}>
              "{previewInfo}"
            </span>
          )}
          {duration && (
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              ({duration})
            </span>
          )}
          {!showAgentCard && !showTodoList && (
            <div className="ml-auto cursor-pointer select-none" onClick={handleToggle}>
              {isExpanded ? (
                <ChevronDown className="size-4 shrink-0 text-muted-foreground self-center" />
              ) : (
                <ChevronRight className="size-4 shrink-0 text-muted-foreground self-center" />
              )}
            </div>
          )}
        </div>
      )}

      {showTodoList && message.output?.todos && (
        <TodoListDisplay todos={message.output.todos} />
      )}

      {isExpanded && !showAgentCard && !showTodoList && (
        <div className="mt-2 space-y-2">
          {message.input && (
            <div className="bg-accent rounded-md p-3">
              <div className="text-xs font-medium text-muted-foreground mb-1">
                Input
              </div>
              <pre className="text-xs overflow-auto whitespace-pre-wrap break-all">
                {JSON.stringify(message.input, null, 2)}
              </pre>
            </div>
          )}

          {isError && message.error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
              <div className="text-xs font-medium text-destructive mb-1">
                Error
              </div>
              <pre className="text-xs overflow-auto whitespace-pre-wrap break-all text-destructive">
                {message.error}
              </pre>
            </div>
          )}

          {message.output && (
            <div className="space-y-2">

                <div className="bg-accent rounded-md p-3">
                  <div className="text-xs font-medium text-muted-foreground mb-1">
                    Output
                  </div>
                  <pre className="text-xs overflow-auto whitespace-pre-wrap break-all">
                    {JSON.stringify(message.output, null, 2)}
                  </pre>
                </div>

            </div>
          )}
        </div>
      )}

      {showAgentCard && message.output && (
        <AgentCard
          agent={message.output as Agent}
        />
      )}
    </div>
  );
}
