import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';

interface CopyToClipboardButtonProps {
  text: string;
  className?: string;
}

export function CopyToClipboardButton({ text, className }: CopyToClipboardButtonProps) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  return (
    <Button
      variant="ghost"
      size="xs"
      onClick={handleCopy}
      className={cn('size-6 p-0', className)}
    >
      {isCopied ? (
        <Check className="size-3 text-green-600 dark:text-green-400" />
      ) : (
        <Copy className="size-3 text-muted-foreground" />
      )}
    </Button>
  );
}
