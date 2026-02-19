import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check, Play, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Agent } from '@oktaman/shared';
import { AgentIcon } from '@/app/components/agents/agent-icon';
import { AgentTriggerIcon } from '@/components/custom/agent-trigger-icon';
import { useNavigate } from 'react-router-dom';
import { useTestAgent } from '@/lib/hooks/agent-hooks';
import cronstrue from 'cronstrue';

interface AgentCardProp {
  className?: string;
  agent: Agent;
}

export function AgentCard({
  agent,
  className,
}: AgentCardProp) {
  const [isCopied, setIsCopied] = useState(false);
  const testAgentMutation = useTestAgent();
  const navigate = useNavigate();

  const trigger = agent.trigger;
  const isWebhook = trigger.type === 'webhook';
  const isCron = trigger.type === 'cron';

  const handleCopyWebhookUrl = async () => {
    if (!agent) return;

    const webhookUrl = `${window.location.origin}/api/v1/webhooks/${agent.webhookId}`;
    await navigator.clipboard.writeText(webhookUrl);
    setIsCopied(true);
    toast.success('Webhook URL copied to clipboard');

    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  const handleTest = async () => {
    try {
      const { sessionId: resultSessionId } = await testAgentMutation.mutateAsync({
        agentId: agent.id,
        // Don't pass sessionId - always create new session
      });

      toast.success('Test agent triggered successfully');
      navigate(`/sessions/${resultSessionId}`);
    } catch (error) {
      toast.error('Failed to test agent');
      console.error(error);
    }
  };

  return (
    <div className={cn('mt-3 border border-border bg-muted/30 rounded-md p-4 space-y-3', className)}>
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <AgentIcon color={agent.color} />
          <div className="text-sm font-medium flex-1">{agent.name}</div>
          <AgentTriggerIcon
            trigger={{
              type: trigger.type!,
              slug: trigger.slug,
            }}
            className="size-8 shrink-0"
          />
        </div>
        <div className="text-xs text-muted-foreground">{agent.description}</div>

        {isWebhook && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-muted/50 rounded-lg p-3 font-mono text-xs break-all">
                {`${window.location.origin}/api/v1/webhooks/${agent.webhookId}`}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={handleCopyWebhookUrl}
                disabled={isCopied}
              >
                {isCopied ? (
                  <Check className="size-4 text-green-600" />
                ) : (
                  <Copy className="size-4" />
                )}
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              Add this URL to your external service to receive webhooks
            </div>
          </div>
        )}

        {isCron && trigger.cron && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 rounded-lg p-2">
              <Clock className="size-4 text-muted-foreground shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-medium">
                  {cronstrue.toString(trigger.cron)}
                </div>
              </div>
            </div>
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          className="w-full mt-2"
          onClick={handleTest}
          disabled={testAgentMutation.isPending}
        >
          <Play className="size-4 mr-2" />
          {testAgentMutation.isPending ? 'Testing...' : 'Test Agent'}
        </Button>
      </div>
    </div>
  );
}
