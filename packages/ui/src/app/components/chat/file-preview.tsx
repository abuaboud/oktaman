import { FileIcon, Loader2, AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

type FilePreviewProps = {
  name: string;
  href?: string;
  icon?: ReactNode;
  isLoading?: boolean;
  isError?: boolean;
  onRemove?: () => void;
  trailingIcon?: ReactNode;
  className?: string;
};

export const FilePreview = ({
  name,
  href,
  icon,
  isLoading,
  isError,
  onRemove,
  trailingIcon,
  className,
}: FilePreviewProps) => {
  const defaultIcon = <FileIcon className="w-4 h-4 text-muted-foreground shrink-0" />;
  
  const leadingIcon = isLoading ? (
    <Loader2 className="w-4 h-4 text-muted-foreground shrink-0 animate-spin" />
  ) : isError ? (
    <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
  ) : (
    icon || defaultIcon
  );

  const content = (
    <>
      {leadingIcon}
      <span
        className={cn(
          'text-sm truncate',
          isError ? 'text-destructive' : 'text-foreground'
        )}
      >
        {name}
      </span>
      {trailingIcon}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onRemove();
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto shrink-0 text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </>
  );

  const baseClassName = cn(
    'group relative inline-flex items-center gap-2 bg-muted/50 border rounded-md px-3 py-1.5 max-w-[300px]',
    isError ? 'border-destructive' : 'border-border',
    href && 'hover:bg-muted transition-colors',
    className
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={baseClassName}
      >
        {content}
      </a>
    );
  }

  return <div className={baseClassName}>{content}</div>;
};
