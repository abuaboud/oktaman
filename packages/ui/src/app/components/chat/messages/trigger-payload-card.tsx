import { Zap } from 'lucide-react';
import { CollapsableMessage } from './collapsable-message';

interface TriggerPayloadCardProps {
  payload: Record<string, any>;
  triggerName?: string;
}

export function TriggerPayloadCard({ payload, triggerName }: TriggerPayloadCardProps) {
  const title = triggerName ? `Trigger: ${triggerName}` : 'Trigger Data';

  return (
    <CollapsableMessage
      icon={<Zap className="size-4 shrink-0 text-orange-600 dark:text-orange-400" />}
      title={title}
      content={payload}
      defaultExpanded={false}
    />
  );
}
