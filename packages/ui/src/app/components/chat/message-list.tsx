import { useCallback, useEffect, useRef } from 'react';
import { ConversationMessage } from '@oktaman/shared';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LLMMessage } from './messages/llm-message';
import { UserMessage } from './messages/user-message';
import { CompactionMessage } from './messages/compaction-message';
import { InterruptedMessage } from './messages/interrupted-message';
import { hashString } from '@/lib/utils';

interface MessageListProps {
  conversation: ConversationMessage[];
  className?: string;
  isStreaming?: boolean;
}

export function MessageList({ conversation, className, isStreaming }: MessageListProps) {
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const isUserScrolledUp = useRef(false);

  // Check if user is at the bottom of the scroll area
  const handleScroll = useCallback(() => {
    const viewport = scrollViewportRef.current;
    if (!viewport) return;

    const threshold = 50; // pixels from bottom to consider "at bottom"
    const isAtBottom =
      viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < threshold;
    isUserScrolledUp.current = !isAtBottom;
  }, []);

  // Auto-scroll to bottom when conversation updates, but only if user hasn't scrolled up
  useEffect(() => {
    if (!isUserScrolledUp.current && scrollViewportRef.current) {
      scrollViewportRef.current.scrollTo({
        top: scrollViewportRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [conversation]);

  // Check if the last message is interrupted to stop animations
  const lastMessage = conversation.length > 0 ? conversation[conversation.length - 1] : null;
  const isStopped = lastMessage?.role === 'interrupted';

  return (
    <ScrollArea
      className={className}
      viewPortRef={scrollViewportRef}
      onScrollCapture={handleScroll}
    >
      <div className="max-w-3xl mx-auto py-4 space-y-8">
        {conversation.map((message, index) => {
          const isLastMessage = index === conversation.length - 1;
          const key = hashString(JSON.stringify(message) + index);

          if (message.role === 'assistant') {
            return (
              <LLMMessage
                key={key}
                message={message}
                isLastMessage={isLastMessage}
                isStreaming={isStreaming}
                isStopped={isStopped}
              />
            );
          } else if (message.role === 'compaction') {
            return <CompactionMessage key={key} message={message} />;
          } else if (message.role === 'interrupted') {
            return <InterruptedMessage key={key} message={message} />;
          } else {
            return <UserMessage key={key} message={message} />;
          }
        })}
      </div>
    </ScrollArea>
  );
}