import { Settings, ProviderType } from '@oktaman/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ModelSelector, PROVIDER_MODELS, PROVIDER_EMBEDDING_MODELS, DEFAULT_MODELS, findModelById } from '@/app/components/chat/prompt-input/model-selector';
import { settingsHooks } from '@/lib/hooks/settings-hooks';
import { useState } from 'react';
import { Eye, EyeOff, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

const PROVIDER_OPTIONS: { value: ProviderType; label: string; description: string }[] = [
  { value: 'openrouter', label: 'OpenRouter', description: 'Access many AI models with one API key' },
  { value: 'openai', label: 'OpenAI', description: 'GPT-5.2' },
  { value: 'ollama', label: 'Ollama', description: 'Run models locally, no API key needed' },
];

export function LlmSection({ settings }: LlmSectionProps) {
  const savedProviderType = settings.provider?.type ?? 'openrouter';
  const [providerType, setProviderType] = useState<ProviderType>(savedProviderType);
  const [apiKey, setApiKey] = useState(settings.provider?.apiKey || '');
  const [baseUrl, setBaseUrl] = useState(settings.provider?.baseUrl || 'http://localhost:11434');
  const [defaultModelId, setDefaultModelId] = useState(settings.defaultModelId);
  const [embeddingModelId, setEmbeddingModelId] = useState(settings.embeddingModelId);
  const [showKey, setShowKey] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const updateMutation = settingsHooks.useUpdateLlmSettings();

  function handleProviderChange(newProvider: ProviderType) {
    setProviderType(newProvider);
    setApiKey('');
    setBaseUrl('http://localhost:11434');
    const defaults = DEFAULT_MODELS[newProvider];
    setDefaultModelId(defaults.chat);
    setEmbeddingModelId(defaults.embedding);
    setHasChanges(true);
  }

  async function handleSave() {
    await updateMutation.mutateAsync({
      provider: {
        type: providerType,
        ...(providerType !== 'ollama' ? { apiKey } : {}),
        ...(providerType === 'ollama' ? { baseUrl: baseUrl || 'http://localhost:11434' } : {}),
      },
      defaultModelId,
      embeddingModelId,
    });
    setHasChanges(false);
  }

  const chatModels = PROVIDER_MODELS[providerType];
  const embeddingModels = PROVIDER_EMBEDDING_MODELS[providerType];

  const selectedDefaultModel = findModelById(defaultModelId, chatModels) ?? chatModels[0];
  const selectedEmbeddingModel = findModelById(embeddingModelId, embeddingModels) ?? embeddingModels[0];

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
                Choose your AI provider and which models power your conversations
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
          <Label>AI Provider</Label>
          <div className="grid grid-cols-3 gap-2">
            {PROVIDER_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => handleProviderChange(option.value)}
                className={cn(
                  'flex flex-col items-start gap-1 rounded-lg border-2 p-3 text-left transition-colors',
                  providerType === option.value
                    ? 'border-indigo-500 bg-indigo-500/5'
                    : 'border-muted hover:border-muted-foreground/30'
                )}
              >
                <span className="text-sm font-medium">{option.label}</span>
                <span className="text-xs text-muted-foreground">{option.description}</span>
              </button>
            ))}
          </div>
        </div>

        {providerType !== 'ollama' && (
          <div className="space-y-2">
            <Label htmlFor="provider-key">
              {providerType === 'openrouter' ? 'OpenRouter' : 'OpenAI'} API Key
            </Label>
            <div className="flex gap-2">
              <Input
                id="provider-key"
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => { setApiKey(e.target.value); setHasChanges(true); }}
                placeholder={providerType === 'openrouter' ? 'sk-or-v1-...' : 'sk-...'}
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
              {providerType === 'openrouter' ? (
                <>Get your key from{' '}
                  <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    openrouter.ai/keys
                  </a>
                </>
              ) : (
                <>Get your key from{' '}
                  <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    platform.openai.com/api-keys
                  </a>
                </>
              )}
            </p>
          </div>
        )}

        {providerType === 'ollama' && (
          <div className="space-y-2">
            <Label htmlFor="ollama-url">Ollama Base URL</Label>
            <Input
              id="ollama-url"
              type="text"
              value={baseUrl}
              onChange={(e) => { setBaseUrl(e.target.value); setHasChanges(true); }}
              placeholder="http://localhost:11434"
              className="flex-1"
            />
            <p className="text-xs text-muted-foreground">
              The URL where your Ollama server is running. Default is http://localhost:11434
            </p>
          </div>
        )}

        <div className="space-y-2">
          <Label>Default Model</Label>
          <ModelSelector
            selectedModel={selectedDefaultModel}
            onModelChange={(model) => {
              setDefaultModelId(model.id);
              setHasChanges(true);
            }}
            models={chatModels}
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
            models={embeddingModels}
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
