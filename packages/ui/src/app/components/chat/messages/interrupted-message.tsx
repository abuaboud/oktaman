import { AlertCircle } from 'lucide-react';
import type { InterruptedConversationMessage } from '@oktaman/shared';

interface InterruptedMessageProps {
  message: InterruptedConversationMessage;
}

export function InterruptedMessage({ message }: InterruptedMessageProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/50 border border-muted">
      <AlertCircle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      <p className="text-xs text-muted-foreground">
        {message.message}
      </p>
    </div>
  );
}
