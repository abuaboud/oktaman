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
import { Agent, ToolCallConversationMessage, getToolCallLabel } from '@oktaman/shared';
import { AgentCard } from './agent-card';
import { TodoListDisplay } from './todo-list-display';

interface ToolCallMessageProps {
  message: ToolCallConversationMessage;
  className?: string;
  isStopped?: boolean;
}

const TOOL_ICONS: Record<string, ToolIconConfig> = {
  execute_bash: {
    icon: <Terminal className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />,
    colorClass: 'text-emerald-600 dark:text-emerald-400',
  },
  search_trigger: {
    icon: <Workflow className="size-4 shrink-0 text-slate-blue-600 dark:text-slate-blue-400" />,
    colorClass: 'text-slate-blue-600 dark:text-slate-blue-400',
  },
  search_tools: {
    icon: <Wrench className="size-4 shrink-0 text-blue-grey-600 dark:text-blue-grey-400" />,
    colorClass: 'text-blue-grey-600 dark:text-blue-grey-400',
  },
  upsert_agent: {
    icon: <Workflow className="size-4 shrink-0 text-carrot-orange-600 dark:text-carrot-orange-400" />,
    colorClass: 'text-carrot-orange-600 dark:text-carrot-orange-400',
  },
  delete_agent: {
    icon: <Workflow className="size-4 shrink-0 text-red-600 dark:text-red-400" />,
    colorClass: 'text-red-600 dark:text-red-400',
  },
  list_connections: {
    icon: <Workflow className="size-4 shrink-0 text-blue-grey-600 dark:text-blue-grey-400" />,
    colorClass: 'text-blue-grey-600 dark:text-blue-grey-400',
  },
  list_composio_triggers: {
    icon: <Workflow className="size-4 shrink-0 text-slate-blue-600 dark:text-slate-blue-400" />,
    colorClass: 'text-slate-blue-600 dark:text-slate-blue-400',
  },
  list_agents: {
    icon: <Workflow className="size-4 shrink-0 text-blue-grey-600 dark:text-blue-grey-400" />,
    colorClass: 'text-blue-grey-600 dark:text-blue-grey-400',
  },
  memory_store: {
    icon: <Brain className="size-4 shrink-0 text-slate-blue-600 dark:text-slate-blue-400" />,
    colorClass: 'text-slate-blue-600 dark:text-slate-blue-400',
  },
  memory_search: {
    icon: <Brain className="size-4 shrink-0 text-bubblegum-pink-600 dark:text-bubblegum-pink-400" />,
    colorClass: 'text-bubblegum-pink-600 dark:text-bubblegum-pink-400',
  },
  memory_forget: {
    icon: <Brain className="size-4 shrink-0 text-red-600 dark:text-red-400" />,
    colorClass: 'text-red-600 dark:text-red-400',
  },
  write_todos: {
    icon: <ListTodo className="size-4 shrink-0 text-royal-gold-600 dark:text-royal-gold-400" />,
    colorClass: 'text-royal-gold-600 dark:text-royal-gold-400',
  },
  read_todos: {
    icon: <ListTodo className="size-4 shrink-0 text-strong-cyan-600 dark:text-strong-cyan-400" />,
    colorClass: 'text-strong-cyan-600 dark:text-strong-cyan-400',
  },
  ask_question: {
    icon: <MessageCircleQuestion className="size-4 shrink-0 text-bubblegum-pink-600 dark:text-bubblegum-pink-400" />,
    colorClass: 'text-bubblegum-pink-600 dark:text-bubblegum-pink-400',
  },
  COMPOSIO_SEARCH_TOOLS: {
    icon: <Search className="size-4 shrink-0 text-blue-grey-600 dark:text-blue-grey-400" />,
    colorClass: 'text-blue-grey-600 dark:text-blue-grey-400',
  },
  COMPOSIO_MANAGE_CONNECTIONS: {
    icon: <Link className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />,
    colorClass: 'text-emerald-600 dark:text-emerald-400',
  },
  COMPOSIO_MULTI_EXECUTE_TOOL: {
    icon: <Zap className="size-4 shrink-0 text-carrot-orange-600 dark:text-carrot-orange-400" />,
    colorClass: 'text-carrot-orange-600 dark:text-carrot-orange-400',
  },
  COMPOSIO_REMOTE_WORKBENCH: {
    icon: <Code className="size-4 shrink-0 text-slate-blue-600 dark:text-slate-blue-400" />,
    colorClass: 'text-slate-blue-600 dark:text-slate-blue-400',
  },
  COMPOSIO_REMOTE_BASH_TOOL: {
    icon: <Terminal className="size-4 shrink-0 text-strong-cyan-600 dark:text-strong-cyan-400" />,
    colorClass: 'text-strong-cyan-600 dark:text-strong-cyan-400',
  },
  COMPOSIO_GET_TOOL_SCHEMAS: {
    icon: <Wrench className="size-4 shrink-0 text-royal-gold-600 dark:text-royal-gold-400" />,
    colorClass: 'text-royal-gold-600 dark:text-royal-gold-400',
  },
  firecrawl_search: {
    icon: <Search className="size-4 shrink-0 text-bubblegum-pink-600 dark:text-bubblegum-pink-400" />,
    colorClass: 'text-bubblegum-pink-600 dark:text-bubblegum-pink-400',
  },
  firecrawl_scrape: {
    icon: <Search className="size-4 shrink-0 text-strong-cyan-600 dark:text-strong-cyan-400" />,
    colorClass: 'text-strong-cyan-600 dark:text-strong-cyan-400',
  },
  firecrawl_crawl: {
    icon: <Search className="size-4 shrink-0 text-royal-gold-600 dark:text-royal-gold-400" />,
    colorClass: 'text-royal-gold-600 dark:text-royal-gold-400',
  },
  firecrawl_batch_scrape: {
    icon: <Search className="size-4 shrink-0 text-carrot-orange-600 dark:text-carrot-orange-400" />,
    colorClass: 'text-carrot-orange-600 dark:text-carrot-orange-400',
  },
  firecrawl_extract: {
    icon: <FileSearch className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />,
    colorClass: 'text-emerald-600 dark:text-emerald-400',
  },
};

export function ToolCallMessage({
  message,
  className,
  isStopped = false,
}: ToolCallMessageProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const toolIconConfig = TOOL_ICONS[message.toolName];

  const isCompleted = message.status === 'completed';
  const isLoading = !isStopped && (message.status === 'loading' || message.status === 'ready');
  const isError = message.status === 'error';

  const isUpsertAgent = message.toolName === 'upsert_agent';
  const showAgentCard = isUpsertAgent && isCompleted && message.output;

  const isWriteTodos = message.toolName === 'write_todos';
  const showTodoList = isWriteTodos && isCompleted && message.output?.todos;

  const getIcon = () => {
    if (toolIconConfig) {
      return toolIconConfig.icon;
    }
    return <Wrench className="size-3 text-muted-foreground shrink-0" />;
  };

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const { baseLabel, previewInfo } = getToolCallLabel(message);
  const duration = formatDuration(message.startedAt, message.completedAt);

  return (
    <div className={cn('text-sm', className)}>
      {!showTodoList && (
        <div className="flex items-center gap-2 py-1">
          {isError ? (
            <AlertCircle className="size-4 shrink-0 text-destructive" />
          ) : isLoading ? (
            <Loader className={cn("size-4 shrink-0 animate-spin", toolIconConfig?.colorClass || "text-muted-foreground")} />
          ) : (
            getIcon()
          )}
          <span className={cn("font-medium whitespace-nowrap", toolIconConfig?.colorClass)}>
            {baseLabel}
          </span>
          {previewInfo && (
            <span className={cn("truncate", toolIconConfig?.colorClass)}>
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

type ToolIconConfig = {
  icon: React.ReactNode;
  colorClass: string;
};
