import { WebhookIcon, Clock } from 'lucide-react';
import React from 'react';
import { cn } from '@/lib/utils';
import { AgentTrigger } from '@oktaman/shared';
import { ComposioToolkitIcon } from '@/app/components/chat/prompt-input/ask-question-input/composio-toolkit-icon';

interface AgentTriggerIconProps {
  trigger: AgentTrigger;
  className?: string;
}


export const AgentTriggerIcon = React.memo(
  ({ trigger, className }: AgentTriggerIconProps) => {
    if (trigger.type === 'composio' && trigger.slug) {
      return (
        <ComposioToolkitIcon
          slug={trigger.slug}
          type="trigger"
          className={cn('size-11 p-2.5 rounded-lg bg-primary/10', className)}
        />
      );
    }

    if (trigger.type === 'cron') {
      return (
        <div className={cn(
          'flex items-center justify-center rounded-lg bg-primary/10 size-11 p-2.5',
          className
        )}>
          <Clock className="size-5 text-primary" />
        </div>
      );
    }

    return (
      <div className={cn(
        'flex items-center justify-center rounded-lg bg-primary/10 size-11 p-2.5',
        className
      )}>
        <WebhookIcon className="size-5 text-primary" />
      </div>
    );
  },
);

AgentTriggerIcon.displayName = 'TriggerIcon';
