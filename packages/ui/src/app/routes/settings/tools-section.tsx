import { Settings } from '@oktaman/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { settingsHooks } from '@/lib/hooks/settings-hooks';
import { useState } from 'react';
import { Eye, EyeOff, Wrench } from 'lucide-react';

export function ToolsSection({ settings }: ToolsSectionProps) {
  const [composioKey, setComposioKey] = useState(settings.composioApiKey || '');
  const [composioWebhookSecret, setComposioWebhookSecret] = useState(settings.composioWebhookSecret || '');
  const [firecrawlKey, setFirecrawlKey] = useState(settings.firecrawlApiKey || '');
  const [showComposio, setShowComposio] = useState(false);
  const [showComposioWebhook, setShowComposioWebhook] = useState(false);
  const [showFirecrawl, setShowFirecrawl] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const updateMutation = settingsHooks.useUpdateToolsSettings();

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
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
              <Wrench className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Tools Configuration</CardTitle>
              <CardDescription>
                Enable powerful integrations and tools
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
            Optional
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="composio-key">Composio API Key</Label>
          <div className="flex gap-2">
            <Input
              id="composio-key"
              type={showComposio ? 'text' : 'password'}
              value={composioKey}
              onChange={(e) => handleChange(setComposioKey)(e.target.value)}
              placeholder="Optional - for app integrations"
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
              Composio
            </a>
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="composio-webhook-secret">Composio Webhook Secret</Label>
          <div className="flex gap-2">
            <Input
              id="composio-webhook-secret"
              type={showComposioWebhook ? 'text' : 'password'}
              value={composioWebhookSecret}
              onChange={(e) => handleChange(setComposioWebhookSecret)(e.target.value)}
              placeholder="Optional - for webhook verification"
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
            Find your webhook secret in{' '}
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
          <Label htmlFor="firecrawl-key">Firecrawl API Key</Label>
          <div className="flex gap-2">
            <Input
              id="firecrawl-key"
              type={showFirecrawl ? 'text' : 'password'}
              value={firecrawlKey}
              onChange={(e) => handleChange(setFirecrawlKey)(e.target.value)}
              placeholder="Optional - for web scraping"
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
              Firecrawl
            </a>
          </p>
        </div>

        <Button
          onClick={handleSave}
          disabled={!hasChanges || updateMutation.isPending}
          className="w-full"
        >
          {updateMutation.isPending ? 'Saving...' : 'Save Tools Settings'}
        </Button>
      </CardContent>
    </Card>
  );
}

type ToolsSectionProps = {
  settings: Settings;
}
