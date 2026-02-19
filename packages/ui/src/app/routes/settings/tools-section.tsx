import { Settings } from '@oktaman/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { settingsHooks } from '@/lib/hooks/settings-hooks';
import { useState } from 'react';
import { Eye, EyeOff, Globe, Plug, Copy, Check } from 'lucide-react';

export function ToolsSection({ settings }: ToolsSectionProps) {
  const [composioKey, setComposioKey] = useState(settings.composioApiKey || '');
  const [composioWebhookSecret, setComposioWebhookSecret] = useState(settings.composioWebhookSecret || '');
  const [firecrawlKey, setFirecrawlKey] = useState(settings.firecrawlApiKey || '');
  const [showComposio, setShowComposio] = useState(false);
  const [showComposioWebhook, setShowComposioWebhook] = useState(false);
  const [showFirecrawl, setShowFirecrawl] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [webhookCopied, setWebhookCopied] = useState(false);

  const updateMutation = settingsHooks.useUpdateToolsSettings();

  const webhookUrl = `${window.location.origin}/api/v1/composio/webhook`;

  function handleCopyWebhookUrl() {
    navigator.clipboard.writeText(webhookUrl);
    setWebhookCopied(true);
    setTimeout(() => setWebhookCopied(false), 2000);
  }

  function handleChange(setter: (value: string) => void) {
    return (value: string) => {
      setter(value);
      setHasChanges(true);
    };
  }

  async function handleSave() {
    await updateMutation.mutateAsync({
      composioApiKey: composioKey,
      composioWebhookSecret,
      firecrawlApiKey: firecrawlKey,
    });
    setHasChanges(false);
  }

  return (
    <div className="space-y-6">
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-500/10">
                <Globe className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <CardTitle className="text-lg">Web Scraping</CardTitle>
                <CardDescription>
                  Extract content from websites and web pages
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
              Optional
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Enable web scraping to let OktaMan read and extract content from any website. This is useful for researching topics, summarizing articles, or gathering data from the web during conversations.
          </p>

          <div className="space-y-4 rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <Label className="text-base font-semibold">Firecrawl</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Firecrawl converts websites into clean, structured data ready for AI consumption. It handles JavaScript rendering, pagination, and anti-bot measures automatically.
            </p>

            <div className="space-y-2">
              <Label htmlFor="firecrawl-key">API Key</Label>
              <div className="flex gap-2">
                <Input
                  id="firecrawl-key"
                  type={showFirecrawl ? 'text' : 'password'}
                  value={firecrawlKey}
                  onChange={(e) => handleChange(setFirecrawlKey)(e.target.value)}
                  placeholder="Enter your Firecrawl API key"
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowFirecrawl(!showFirecrawl)}
                  type="button"
                >
                  {showFirecrawl ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Get your API key from{' '}
                <a
                  href="https://firecrawl.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  firecrawl.dev
                </a>
                . The free tier includes 500 credits to get started.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
                <Plug className="h-5 w-5 text-violet-500" />
              </div>
              <div>
                <CardTitle className="text-lg">External Integrations</CardTitle>
                <CardDescription>
                  Connect to third-party apps and services
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
              Optional
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Connect OktaMan to your favorite apps and services. External integrations allow the agent to take actions on your behalf, such as sending emails, creating calendar events, managing tasks, and more.
          </p>

          <div className="space-y-4 rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <Label className="text-base font-semibold">Composio</Label>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                Recommended
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Connect to external apps like Gmail, Slack, Google Calendar, GitHub, and hundreds more. Composio handles authentication and provides ready-to-use tool calling for third-party services.
            </p>

            <div className="space-y-2">
              <Label htmlFor="composio-key">API Key</Label>
              <div className="flex gap-2">
                <Input
                  id="composio-key"
                  type={showComposio ? 'text' : 'password'}
                  value={composioKey}
                  onChange={(e) => handleChange(setComposioKey)(e.target.value)}
                  placeholder="Enter your Composio API key"
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowComposio(!showComposio)}
                  type="button"
                >
                  {showComposio ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Get your API key from{' '}
                <a
                  href="https://app.composio.dev/settings"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  app.composio.dev
                </a>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="composio-webhook-secret">Webhook Secret</Label>
              <div className="flex gap-2">
                <Input
                  id="composio-webhook-secret"
                  type={showComposioWebhook ? 'text' : 'password'}
                  value={composioWebhookSecret}
                  onChange={(e) => handleChange(setComposioWebhookSecret)(e.target.value)}
                  placeholder="Enter your webhook secret"
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowComposioWebhook(!showComposioWebhook)}
                  type="button"
                >
                  {showComposioWebhook ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Required for receiving triggers from connected apps. Find your webhook secret in{' '}
                <a
                  href="https://app.composio.dev/settings"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Composio settings
                </a>
              </p>
            </div>

            <div className="space-y-2">
              <Label>Webhook URL</Label>
              <p className="text-xs text-muted-foreground">
                Copy this URL and paste it in your Composio webhook settings to receive external triggers.
              </p>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={webhookUrl}
                  className="flex-1 font-mono text-xs"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyWebhookUrl}
                  type="button"
                >
                  {webhookCopied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={handleSave}
        disabled={!hasChanges || updateMutation.isPending}
        className="w-full"
      >
        {updateMutation.isPending ? 'Saving...' : 'Save Tools Settings'}
      </Button>
    </div>
  );
}

type ToolsSectionProps = {
  settings: Settings;
}
