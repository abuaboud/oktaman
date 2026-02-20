import { cn } from '@/lib/utils';
import { AssistantAttachmentConversationMessage } from '@oktaman/shared';

interface AssistantAttachmentBlockProps {
  message: AssistantAttachmentConversationMessage;
  className?: string;
}

export function AssistantAttachmentBlock({
  message,
  className,
}: AssistantAttachmentBlockProps) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      <a
        href={message.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <img
          src={message.url}
          alt={message.altText || ''}
          className="max-w-full max-h-[300px] rounded-md border border-border object-contain"
        />
      </a>
    </div>
  );
}
