import { useState } from 'react';
import { ChevronDown, Brain } from 'lucide-react';
import { cn, formatDuration } from '@/lib/utils';
import { Markdown } from '@/components/custom/markdown';

interface ThinkingBlockProps {
  children: string;
  isCollapsible?: boolean;
  startedAt?: string;
  completedAt?: string;
}

export function ThinkingBlock({ children, isCollapsible = true, startedAt, completedAt }: ThinkingBlockProps) {
  const [isOpen, setIsOpen] = useState(false);
  const duration = formatDuration(startedAt, completedAt);

  if (!isCollapsible) {
    return (
      <div className="flex items-start gap-2 text-sm">
        <Brain className="size-3.5 mt-0.5" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span>Thinking</span>
            {duration && <span className="text-xs text-muted-foreground">({duration})</span>}
          </div>
          <div className="mt-1 italic pl-3 border-l-2 border-muted">
            <Markdown>{children}</Markdown>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="space-y-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm hover:text-foreground transition-colors"
      >
        <Brain className="size-3.5" />
        <span className="italic">
          Thought{duration && ` (${duration})`}
        </span>
        <ChevronDown
          className={cn(
            'size-3.5 transition-transform',
            isOpen && 'transform rotate-180'
          )}
        />
      </button>
      {isOpen && (
        <div className="text-sm italic pl-5 border-l-2 border-muted">
          <Markdown>{children}</Markdown>
        </div>
      )}
    </div>
  );
}
