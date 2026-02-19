import { cn } from '@/lib/utils';
import {
  UserConversationMessage,
  UserFileConversationMessage,
  UserImageConversationMessage,
  UserTextConversationMessage,
  UserInstructionsConversationMessage,
  UserTriggerPayloadConversationMessage,
} from '@oktaman/shared';
import { FilePreview } from '../file-preview';
import { ImageIcon, BookOpen } from 'lucide-react';
import { CollapsableMessage } from './collapsable-message';
import { TriggerPayloadCard } from './trigger-payload-card';
import { Markdown } from '@/components/custom/markdown';

interface UserMessageProps {
  className?: string;
  message: UserConversationMessage;
}

export function UserMessage({ className, message }: UserMessageProps) {
  const textContent = message.content.filter(
    (c: typeof message.content[number]): c is UserTextConversationMessage => c.type === 'text',
  );
  const fileContent = message.content.filter(
    (c: typeof message.content[number]): c is UserFileConversationMessage => c.type === 'file',
  );
  const imageContent = message.content.filter(
    (c: typeof message.content[number]): c is UserImageConversationMessage => c.type === 'image',
  );
  const instructionsContent = message.content.filter(
    (c: typeof message.content[number]): c is UserInstructionsConversationMessage => c.type === 'instructions',
  );
  const triggerPayloadContent = message.content.filter(
    (c: typeof message.content[number]): c is UserTriggerPayloadConversationMessage => c.type === 'trigger-payload',
  );

  const hasAttachments = fileContent.length > 0 || imageContent.length > 0;

  return (
    <div className="flex flex-col items-end gap-2 ml-auto max-w-[70%]">
      {textContent.length > 0 && (
        <div className={cn('text-base bg-accent rounded-2xl px-4 py-2 break-all', className)}>
          {textContent.map((content: UserTextConversationMessage, index: number) => (
            <Markdown key={`text-${index}`}>{content.message}</Markdown>
          ))}
        </div>
      )}
      {hasAttachments && (
        <div className="flex flex-wrap gap-2 justify-end">
          {fileContent.map((content: UserFileConversationMessage, index: number) => (
            <FilePreview
              key={`file-${index}`}
              name={content.name || 'File'}
              href={content.file}
            />
          ))}
          {imageContent.map((content: UserImageConversationMessage, index: number) => (
            <FilePreview
              key={`image-${index}`}
              name={content.name || 'Image'}
              href={content.image}
              icon={<ImageIcon className="w-4 h-4 text-muted-foreground shrink-0" />}
            />
          ))}
        </div>
      )}
      {instructionsContent.length > 0 && (
        <div className="w-full">
          {instructionsContent.map((content: UserInstructionsConversationMessage, index: number) => (
            <CollapsableMessage
              key={`instructions-${index}`}
              icon={<BookOpen className="size-4 shrink-0 text-blue-600 dark:text-blue-400" />}
              title="Instructions"
              content={content.instructions}
            />
          ))}
        </div>
      )}
      {triggerPayloadContent.length > 0 && (
        <div className="w-full">
          {triggerPayloadContent.map((content: UserTriggerPayloadConversationMessage, index: number) => (
            <TriggerPayloadCard
              key={`trigger-${index}`}
              payload={content.payload}
              triggerName={content.triggerName}
            />
          ))}
        </div>
      )}
    </div>
  );
}
