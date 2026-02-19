import { Settings } from '@oktaman/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { settingsHooks } from '@/lib/hooks/settings-hooks';
import { useState } from 'react';
import { TelegramChannelForm } from './telegram-channel-form';
import { Radio } from 'lucide-react';

export function ChannelsSection({ settings }: ChannelsSectionProps) {
  const [showTelegramForm, setShowTelegramForm] = useState(false);

  const addChannelMutation = settingsHooks.useAddChannel();
  const removeChannelMutation = settingsHooks.useRemoveChannel();

  const telegramChannel = settings.channels.find(c => c.type === 'TELEGRAM');

  async function handleAddTelegram(name: string, config: Record<string, unknown>) {
    await addChannelMutation.mutateAsync({
      name,
      type: 'TELEGRAM',
      config,
    });
    setShowTelegramForm(false);
  }

  async function handleDisconnect() {
    if (telegramChannel && confirm('Are you sure you want to disconnect this channel?')) {
      await removeChannelMutation.mutateAsync(telegramChannel.id);
    }
  }

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-500/10">
              <Radio className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Channels</CardTitle>
              <CardDescription>
                Connect messaging platforms to interact with your agents
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
            Optional
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Telegram Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950">
                <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-medium">Telegram</h4>
                <p className="text-xs text-muted-foreground">
                  {telegramChannel ? 'Connected' : 'Not connected'}
                </p>
              </div>
            </div>
            {!telegramChannel && !showTelegramForm && (
              <Button onClick={() => setShowTelegramForm(true)} size="sm">
                Connect
              </Button>
            )}
            {telegramChannel && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnect}
                disabled={removeChannelMutation.isPending}
                className="text-destructive"
              >
                Disconnect
              </Button>
            )}
          </div>

          {showTelegramForm && !telegramChannel && (
            <div className="pl-11">
              <div className="border rounded-lg p-4 bg-muted/30">
                <TelegramChannelForm
                  onSave={handleAddTelegram}
                  onCancel={() => setShowTelegramForm(false)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Slack Section (Coming Soon) */}
        <div className="space-y-3 opacity-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 dark:bg-red-950">
                <svg className="h-5 w-5 text-red-600 dark:text-red-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M5.042 15.165a2.528 2.528 0 01-2.52 2.523A2.528 2.528 0 010 15.165a2.527 2.527 0 012.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 012.521-2.52 2.527 2.527 0 012.521 2.52v6.313A2.528 2.528 0 018.834 24a2.528 2.528 0 01-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 01-2.521-2.52A2.528 2.528 0 018.834 0a2.528 2.528 0 012.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 012.521 2.521 2.528 2.528 0 01-2.521 2.521H2.522A2.528 2.528 0 010 8.834a2.528 2.528 0 012.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 012.522-2.521A2.528 2.528 0 0124 8.834a2.528 2.528 0 01-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 01-2.523 2.521 2.527 2.527 0 01-2.52-2.521V2.522A2.527 2.527 0 0115.165 0a2.528 2.528 0 012.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 012.523 2.522A2.528 2.528 0 0115.165 24a2.527 2.527 0 01-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 01-2.52-2.523 2.526 2.526 0 012.52-2.52h6.313A2.527 2.527 0 0124 15.165a2.528 2.528 0 01-2.522 2.523h-6.313z"/>
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-medium">Slack</h4>
                <p className="text-xs text-muted-foreground">Coming soon</p>
              </div>
            </div>
            <Button size="sm" disabled>
              Connect
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

type ChannelsSectionProps = {
  settings: Settings;
}
