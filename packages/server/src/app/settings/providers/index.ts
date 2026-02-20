import { ProviderConfig } from '@oktaman/shared';
import { createOpenRouter, OpenRouterProviderOptions } from '@openrouter/ai-sdk-provider';
import { createOpenAI } from '@ai-sdk/openai';
import { LanguageModelV3, EmbeddingModelV3 } from '@ai-sdk/provider';

export function createModel(provider: ProviderConfig, modelId: string): LanguageModelV3 {
    switch (provider.type) {
        case 'openrouter': {
            const openrouter = createOpenRouter({ apiKey: provider.apiKey });
            return openrouter(modelId, { usage: { include: true } });
        }
        case 'openai': {
            const openai = createOpenAI({ apiKey: provider.apiKey });
            return openai(modelId);
        }
        case 'ollama': {
            const ollama = createOpenAI({
                apiKey: 'ollama',
                baseURL: provider.baseUrl ?? 'http://localhost:11434/v1',
            });
            return ollama(modelId);
        }
    }
}

export function createEmbeddingModel(provider: ProviderConfig, modelId: string): EmbeddingModelV3 {
    switch (provider.type) {
        case 'openrouter': {
            const openrouter = createOpenAI({
                apiKey: provider.apiKey,
                baseURL: 'https://openrouter.ai/api/v1',
            });
            return openrouter.embedding(modelId);
        }
        case 'openai': {
            const openai = createOpenAI({ apiKey: provider.apiKey });
            return openai.embedding(modelId);
        }
        case 'ollama': {
            const ollama = createOpenAI({
                apiKey: 'ollama',
                baseURL: provider.baseUrl ?? 'http://localhost:11434/v1',
            });
            return ollama.embedding(modelId);
        }
    }
}

export function getProviderOptions(provider: ProviderConfig): { openrouter?: OpenRouterProviderOptions } {
    if (provider.type === 'openrouter') {
        return {
            openrouter: {
                reasoning: {
                    enabled: true,
                    exclude: false,
                    effort: 'high',
                },
            } satisfies OpenRouterProviderOptions,
        };
    }
    return {};
}

export function extractCost(providerType: ProviderConfig['type'], providerMetadata: unknown): number {
    if (providerType === 'openrouter') {
        const cost = (providerMetadata as ProviderMetadataShape)?.openrouter?.usage?.cost;
        return cost ?? 0;
    }
    return 0;
}

type ProviderMetadataShape = {
    openrouter?: {
        usage?: {
            cost?: number;
        };
    };
};
