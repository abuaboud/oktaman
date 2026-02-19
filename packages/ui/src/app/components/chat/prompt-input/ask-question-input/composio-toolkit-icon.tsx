import { ImageWithColorBackground } from '@/components/ui/image-with-background';
import { cn } from '@/lib/utils';

interface ComposioToolkitIconProps {
  slug: string;
  type: 'trigger' | 'toolkit';
  className?: string;
}

export const ComposioToolkitIcon = ({
  slug,
  type,
  className = ""
}: ComposioToolkitIconProps) => {

  const logoUrl = type === 'trigger' ? `/api/v1/composio/logo/${encodeURIComponent(slug)}/trigger` : `/api/v1/composio/logo/${encodeURIComponent(slug)}/toolkit`;
  return (
    <ImageWithColorBackground
      src={logoUrl}
      className={cn('size-11 p-2.5 rounded-lg bg-primary/10', className)}
      border={true}
    />
  );
};
