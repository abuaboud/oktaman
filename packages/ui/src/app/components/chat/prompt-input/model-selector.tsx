import { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ProviderType } from '@oktaman/shared';

const PROVIDER_MODELS: Record<ProviderType, AIModel[]> = {
  openrouter: [
    {
      id: 'anthropic/claude-sonnet-4.6',
      name: 'Claude Sonnet 4.6',
      provider: 'anthropic',
      logo: 'https://models.dev/logos/anthropic.svg',
    },
    {
      id: 'google/gemini-3.1-pro-preview',
      name: 'Gemini 3.1 Pro',
      provider: 'google',
      logo: 'https://models.dev/logos/google.svg',
    },
    {
      id: 'qwen/qwen3.5-plus-02-15',
      name: 'Qwen 3.5 Plus',
      provider: 'qwen',
      logo: 'https://models.dev/logos/qwen.svg',
    },
    {
      id: 'moonshotai/kimi-k2.5',
      name: 'Kimi K2.5',
      provider: 'moonshotai',
      logo: 'https://models.dev/logos/moonshotai.svg',
    },
    {
      id: 'minimax/minimax-m2.5',
      name: 'MiniMax M2.5',
      provider: 'minimax',
      logo: 'https://models.dev/logos/minimax.svg',
    },
  ],
  openai: [
    {
      id: 'gpt-5.2',
      name: 'GPT-5.2',
      provider: 'openai',
      logo: 'https://models.dev/logos/openai.svg',
    },
  ],
  ollama: [
    {
      id: 'kimi-k2.5:cloud',
      name: 'Kimi K2.5',
      provider: 'ollama',
      logo: 'https://models.dev/logos/moonshotai.svg',
    },
    {
      id: 'minimax-m2.5:cloud',
      name: 'MiniMax M2.5',
      provider: 'ollama',
      logo: 'https://models.dev/logos/minimax.svg',
    },
  ],
};

const PROVIDER_EMBEDDING_MODELS: Record<ProviderType, AIModel[]> = {
  openrouter: [
    {
      id: 'openai/text-embedding-3-small',
      name: 'Embedding 3 Small',
      provider: 'openai',
      logo: 'https://models.dev/logos/openai.svg',
    },
    {
      id: 'openai/text-embedding-3-large',
      name: 'Embedding 3 Large',
      provider: 'openai',
      logo: 'https://models.dev/logos/openai.svg',
    },
  ],
  openai: [
    {
      id: 'text-embedding-3-small',
      name: 'Embedding 3 Small',
      provider: 'openai',
      logo: 'https://models.dev/logos/openai.svg',
    },
    {
      id: 'text-embedding-3-large',
      name: 'Embedding 3 Large',
      provider: 'openai',
      logo: 'https://models.dev/logos/openai.svg',
    },
  ],
  ollama: [
    {
      id: 'nomic-embed-text',
      name: 'Nomic Embed Text',
      provider: 'ollama',
      logo: 'https://models.dev/logos/meta.svg',
    },
  ],
};

const DEFAULT_MODELS: Record<ProviderType, { chat: string; embedding: string }> = {
  openrouter: {
    chat: 'moonshotai/kimi-k2.5',
    embedding: 'openai/text-embedding-3-small',
  },
  openai: {
    chat: 'gpt-5.2',
    embedding: 'text-embedding-3-small',
  },
  ollama: {
    chat: 'kimi-k2.5:cloud',
    embedding: 'nomic-embed-text',
  },
};

// Backward-compat exports
const MODELS = PROVIDER_MODELS.openrouter;
const EMBEDDING_MODELS = PROVIDER_EMBEDDING_MODELS.openrouter;

function findModelById(modelId: string, modelList: AIModel[]): AIModel | undefined {
  return modelList.find((m) => m.id === modelId);
}

export const ModelSelector = ({ selectedModel, onModelChange, disabled, models, className }: ModelSelectorProps) => {
  const [open, setOpen] = useState(false);
  const modelList = models ?? MODELS;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn("h-8 w-[140px] gap-1 px-2.5 text-xs font-normal justify-start text-left", className)}
          disabled={disabled}
        >
          <img
            src={selectedModel.logo}
            alt={selectedModel.provider}
            className="h-3.5 w-3.5 object-contain flex-shrink-0 dark:invert"
          />
          <span className="text-left flex-1 min-w-0 truncate">{selectedModel.name}</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground flex-shrink-0 ml-auto" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-1" align="start">
        <div className="space-y-0.5">
          <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
            Select Model
          </div>
          {modelList.map((model) => (
            <button
              key={model.id}
              onClick={() => {
                onModelChange(model);
                setOpen(false);
              }}
              className={cn(
                'w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted transition-colors text-left',
                selectedModel.id === model.id && 'bg-muted'
              )}
            >
              <img
                src={model.logo}
                alt={model.provider}
                className="h-4 w-4 object-contain flex-shrink-0 dark:invert"
              />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium">{model.name}</div>
                <div className="text-[10px] text-muted-foreground capitalize">
                  {model.provider}
                </div>
              </div>
              {selectedModel.id === model.id && (
                <Check className="h-3 w-3 text-primary flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export { MODELS, EMBEDDING_MODELS, PROVIDER_MODELS, PROVIDER_EMBEDDING_MODELS, DEFAULT_MODELS, findModelById };

export type AIModel = {
  id: string;
  name: string;
  provider: string;
  logo: string;
};

type ModelSelectorProps = {
  selectedModel: AIModel;
  onModelChange: (model: AIModel) => void;
  disabled?: boolean;
  models?: AIModel[];
  className?: string;
};
