import { cn, hashString, formatDuration } from '@/lib/utils';

import { ToolCallMessage } from './tool-call-message';
import { AssistantConversationMessage } from '@oktaman/shared';
import { Markdown } from '@/components/custom/markdown';
import { CopyToClipboardButton } from '@/components/custom/copy-to-clipboard-button';
import { Clock } from 'lucide-react';
import { StatusAnimation } from './status-animation';
import { ThinkingBlock } from './thinking-block';
import { AgentIcon } from '@/app/components/agents/agent-icon';

interface LLMMessageProps {
  message: AssistantConversationMessage;
  className?: string;
  isLastMessage?: boolean;
  isStreaming?: boolean;
  isStopped?: boolean;
}

export function LLMMessage({
  message,
  className,
  isLastMessage = false,
  isStreaming = false,
  isStopped = false,
}: LLMMessageProps) {

  const hasIncompleteToolCalls = message.parts.some(
    part => part.type === 'tool-call' && (part.status === 'loading' || part.status === 'ready')
  );

  const showAnimation = isLastMessage && isStreaming && !hasIncompleteToolCalls;

  // Extract all text content for copying
  const getMessageText = () => {
    return message.parts
      .filter((part): part is Extract<typeof part, { type: 'text' }> => part.type === 'text')
      .map((part) => part.message)
      .join('\n\n');
  };

  const messageText = getMessageText();
  const showCopyButton = messageText && !(isLastMessage && isStreaming);

  // Only show avatar if there are parts with content
  const showAvatar = message.parts.length > 0;

  // Calculate total duration from first start to last completion
  const getMessageDuration = () => {
    let firstStart: string | null = null;
    let lastComplete: string | null = null;

    for (const part of message.parts) {
      if (part.type === 'text' || part.type === 'thinking' || part.type === 'tool-call') {
        if (part.startedAt && !firstStart) {
          firstStart = part.startedAt;
        }
        if (part.completedAt) {
          lastComplete = part.completedAt;
        }
      }
    }

    return formatDuration(firstStart || undefined, lastComplete || undefined);
  };

  const messageDuration = getMessageDuration();
  const showDuration = messageDuration && !isStreaming;

  const showCost = message.cost != null;
  const formatCost = (cost: number) => `$${cost.toFixed(4)}`;

  return (
    <div
      className={cn(
        'group text-base max-w-[70%] space-y-4 flex items-start gap-3',
        className,
      )}
    >
      {showAvatar && (
        <AgentIcon color="indigo" />
      )}
      <div className="flex-1 space-y-4 !mt-0">
        {message.parts.map((part: typeof message.parts[number], index: number) => {
          if (part.type === 'text') {
            const key = hashString(part.message + index);
            return (
              <Markdown
                key={key}
                children={part.message}
              />
            );
          }
          if (part.type === 'thinking') {
            const key = hashString(part.message + index);
            const isLastPart = index === message.parts.length - 1;
            const isActiveStreaming = isLastMessage && isStreaming && isLastPart;

            return (
              <ThinkingBlock
                key={key}
                isCollapsible={!isActiveStreaming}
                startedAt={part.startedAt}
                completedAt={part.completedAt}
              >
                {part.message}
              </ThinkingBlock>
            );
          }
          if (part.type === 'tool-call') {
            const key = hashString(JSON.stringify(part) + index);
            return (
              <ToolCallMessage
                key={key}
                message={part}
                isStopped={isStopped}
              />
            );
          }
          return null;
        })}
        {showAnimation && <StatusAnimation />}
        <div className="flex items-center gap-2 justify-start">
          {showCopyButton && <CopyToClipboardButton text={messageText} />}
          {showDuration && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="size-3" />
              <span>{messageDuration}</span>
            </div>
          )}
          {showCost && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>{formatCost(message.cost!)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}