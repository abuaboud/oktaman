import { useState, ReactNode } from 'react';
import {
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CollapsableMessageProps {
  icon: ReactNode;
  title: string;
  contentLabel?: string;
  content: string | object;
  defaultExpanded?: boolean;
  className?: string;
}

export function CollapsableMessage({
  icon,
  title,
  contentLabel,
  content,
  defaultExpanded = false,
  className,
}: CollapsableMessageProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const renderContent = () => {
    if (typeof content === 'string') {
      return <div className="text-xs whitespace-pre-wrap break-all">{content}</div>;
    }
    return (
      <pre className="text-xs overflow-auto whitespace-pre-wrap break-all">
        {JSON.stringify(content, null, 2)}
      </pre>
    );
  };

  return (
    <div className={cn('text-sm mb-2', className)}>
      <div
        className="flex items-center gap-2 py-1 px-3 bg-accent/50 rounded-lg cursor-pointer select-none hover:bg-accent transition-colors"
        onClick={handleToggle}
      >
        {icon}
        <span className="font-medium">{title}</span>
        {isExpanded ? (
          <ChevronDown className="size-3 shrink-0 text-muted-foreground self-center ml-auto" />
        ) : (
          <ChevronRight className="size-3 shrink-0 text-muted-foreground self-center ml-auto" />
        )}
      </div>

      {isExpanded && (
        <div className="mt-2 bg-accent rounded-md p-3">
          {contentLabel && (
            <div className="text-xs font-medium text-muted-foreground mb-1">
              {contentLabel}
            </div>
          )}
          {renderContent()}
        </div>
      )}
    </div>
  );
}
