import { Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ToolCallConversationMessage } from '@oktaman/shared';
import { FilePreview } from '../file-preview';

export const DISPLAY_ATTACHMENTS_TOOL_NAME = 'display_attachments';

export type AttachmentItem = {
  name: string;
  link: string;
  type: 'url' | 'file';
};

function isImageUrl(url: string): boolean {
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp'];
  const lowerUrl = url.toLowerCase();
  return imageExtensions.some(ext => lowerUrl.includes(ext));
}

function AttachmentPreviewItem({ attachment }: { attachment: AttachmentItem }) {
  const isImage = isImageUrl(attachment.link);

  if (isImage) {
    return (
      <a
        href={attachment.link}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <img
          src={attachment.link}
          alt={attachment.name}
          className="max-w-full max-h-[300px] rounded-md border border-border object-contain"
        />
      </a>
    );
  }

  return (
    <FilePreview
      name={attachment.name}
      href={attachment.link}
      trailingIcon={
        <Download className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity ml-auto shrink-0 text-muted-foreground hover:text-foreground" />
      }
    />
  );
}

interface DisplayAttachmentsMessageProps {
  message: ToolCallConversationMessage;
  className?: string;
}

export function DisplayAttachmentsMessage({
  message,
  className,
}: DisplayAttachmentsMessageProps) {
  const isLoading = message.status === 'loading' || message.status === 'ready';
  const isError = message.status === 'error';

  if (isLoading) {
    return (
      <FilePreview
        name="Preparing..."
        isLoading
        className={className}
      />
    );
  }

  if (isError) {
    return (
      <FilePreview
        name="Failed"
        isError
        className={className}
      />
    );
  }

  const output = message.output as { attachments?: AttachmentItem[] } | undefined;
  const attachments = output?.attachments || [];

  if (attachments.length === 0) {
    return null;
  }

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {attachments.map((attachment, index) => (
        <AttachmentPreviewItem key={index} attachment={attachment} />
      ))}
    </div>
  );
}
