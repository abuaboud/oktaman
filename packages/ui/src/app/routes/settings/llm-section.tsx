import { Settings } from '@oktaman/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ModelSelector, MODELS, EMBEDDING_MODELS, findModelById } from '@/app/components/chat/prompt-input/model-selector';
import { settingsHooks } from '@/lib/hooks/settings-hooks';
import { useState } from 'react';
import { Eye, EyeOff, Bot } from 'lucide-react';

export function LlmSection({ settings }: LlmSectionProps) {
  const [apiKey, setApiKey] = useState(settings.openRouterApiKey || '');
  const [defaultModelId, setDefaultModelId] = useState(settings.defaultModelId);
  const [embeddingModelId, setEmbeddingModelId] = useState(settings.embeddingModelId);
  const [agentModelId, setAgentModelId] = useState(settings.agentModelId);
  const [showKey, setShowKey] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const updateMutation = settingsHooks.useUpdateLlmSettings();

  function handleApiKeyChange(value: string) {
    setApiKey(value);
    setHasChanges(true);
  }

  async function handleSave() {
    await updateMutation.mutateAsync({
      openRouterApiKey: apiKey,
      defaultModelId,
      embeddingModelId,
      agentModelId,
    });
    setHasChanges(false);
  }

  const selectedDefaultModel = findModelById(defaultModelId, MODELS) ?? MODELS[0];
  const selectedEmbeddingModel = findModelById(embeddingModelId, EMBEDDING_MODELS) ?? EMBEDDING_MODELS[0];
  const selectedAgentModel = findModelById(agentModelId, MODELS) ?? findModelById('moonshotai/kimi-k2.5', MODELS) ?? MODELS[0];

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10">
              <Bot className="h-5 w-5 text-indigo-500" />
            </div>
            <div>
              <CardTitle className="text-lg">AI Models & Settings</CardTitle>
              <CardDescription>
                Choose which AI models power your conversations and background tasks
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
            Required
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="openrouter-key">OpenRouter API Key</Label>
          <div className="flex gap-2">
            <Input
              id="openrouter-key"
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => handleApiKeyChange(e.target.value)}
              placeholder="sk-or-v1-..."
              className="flex-1"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowKey(!showKey)}
              type="button"
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            This key connects OktaMan to various AI models. Get yours from{' '}
            <a
              href="https://openrouter.ai/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              OpenRouter
            </a>
          </p>
        </div>

        <div className="space-y-2">
          <Label>Default Chat Model</Label>
          <p className="text-xs text-muted-foreground">
            This is the AI model used for your main conversations and chat interactions
          </p>
          <ModelSelector
            selectedModel={selectedDefaultModel}
            onModelChange={(model) => {
              setDefaultModelId(model.id);
              setHasChanges(true);
            }}
            className="w-full border"
          />
        </div>

        <div className="space-y-2">
          <Label>Default Automation Agent Model</Label>
          <p className="text-xs text-muted-foreground">
            Powers your automated assistants and background workflows. Choose a cost-effective model for high-volume tasks.
          </p>
          <ModelSelector
            selectedModel={selectedAgentModel}
            onModelChange={(model) => {
              setAgentModelId(model.id);
              setHasChanges(true);
            }}
            className="w-full border"
          />
        </div>

        <div className="space-y-2">
          <Label>Embedding Model</Label>
          <p className="text-xs text-muted-foreground">
            Helps OktaMan remember and search through your conversations. This model understands the meaning behind your messages for smarter recall.
          </p>
          <ModelSelector
            selectedModel={selectedEmbeddingModel}
            onModelChange={(model) => {
              setEmbeddingModelId(model.id);
              setHasChanges(true);
            }}
            models={EMBEDDING_MODELS}
            className="w-full border"
          />
        </div>

        <Button
          onClick={handleSave}
          disabled={!hasChanges || updateMutation.isPending}
          className="w-full"
        >
          {updateMutation.isPending ? 'Saving...' : 'Save LLM Settings'}
        </Button>
      </CardContent>
    </Card>
  );
}

type LlmSectionProps = {
  settings: Settings;
}
