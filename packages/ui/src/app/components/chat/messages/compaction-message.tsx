import { CompactionConversationMessage } from '@oktaman/shared';
import { Sparkles } from 'lucide-react';

export function CompactionMessage({ message: _message }: { message: CompactionConversationMessage }) {

  return (
    <div className="flex items-center gap-2 text-sm rounded-lg px-3 py-1 my-2 bg-muted">
      <Sparkles className="w-4 h-4 text-blue-500" />
      <div className="flex flex-col">
        <span>Summarized the conversation</span>
      </div>
    </div>
  );
}
