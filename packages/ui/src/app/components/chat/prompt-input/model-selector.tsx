import { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  ProviderType,
  PROVIDER_MODELS as SHARED_PROVIDER_MODELS,
  PROVIDER_EMBEDDING_MODELS as SHARED_PROVIDER_EMBEDDING_MODELS,
  DEFAULT_MODELS,
  AIModel as SharedAIModel,
} from '@oktaman/shared';

const LOGO_MAP: Record<string, string> = {
  anthropic: 'https://models.dev/logos/anthropic.svg',
  google: 'https://models.dev/logos/google.svg',
  qwen: 'https://models.dev/logos/qwen.svg',
  moonshotai: 'https://models.dev/logos/moonshotai.svg',
  minimax: 'https://models.dev/logos/minimax.svg',
  openai: 'https://models.dev/logos/openai.svg',
  ollama: 'https://models.dev/logos/moonshotai.svg',
  meta: 'https://models.dev/logos/meta.svg',
};

function addLogo(model: SharedAIModel): AIModel {
  return { ...model, logo: LOGO_MAP[model.provider] ?? '' };
}

function addLogos(models: SharedAIModel[]): AIModel[] {
  return models.map(addLogo);
}

const PROVIDER_MODELS: Record<ProviderType, AIModel[]> = {
  openrouter: addLogos(SHARED_PROVIDER_MODELS.openrouter),
  openai: addLogos(SHARED_PROVIDER_MODELS.openai),
  ollama: addLogos(SHARED_PROVIDER_MODELS.ollama),
};

const PROVIDER_EMBEDDING_MODELS: Record<ProviderType, AIModel[]> = {
  openrouter: addLogos(SHARED_PROVIDER_EMBEDDING_MODELS.openrouter),
  openai: addLogos(SHARED_PROVIDER_EMBEDDING_MODELS.openai),
  ollama: addLogos(SHARED_PROVIDER_EMBEDDING_MODELS.ollama).map(m =>
    m.provider === 'ollama' ? { ...m, logo: LOGO_MAP['meta'] } : m
  ),
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

export type AIModel = SharedAIModel & {
  logo: string;
};

type ModelSelectorProps = {
  selectedModel: AIModel;
  onModelChange: (model: AIModel) => void;
  disabled?: boolean;
  models?: AIModel[];
  className?: string;
};
