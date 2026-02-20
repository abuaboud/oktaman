import { ProviderType } from '../settings/index'

export const PROVIDER_MODELS: Record<ProviderType, AIModel[]> = {
    openrouter: [
        {
            id: 'anthropic/claude-sonnet-4.6',
            name: 'Claude Sonnet 4.6',
            provider: 'anthropic',
        },
        {
            id: 'google/gemini-3.1-pro-preview',
            name: 'Gemini 3.1 Pro',
            provider: 'google',
        },
        {
            id: 'qwen/qwen3.5-plus-02-15',
            name: 'Qwen 3.5 Plus',
            provider: 'qwen',
        },
        {
            id: 'moonshotai/kimi-k2.5',
            name: 'Kimi K2.5',
            provider: 'moonshotai',
        },
        {
            id: 'minimax/minimax-m2.5',
            name: 'MiniMax M2.5',
            provider: 'minimax',
        },
    ],
    openai: [
        {
            id: 'gpt-5.2',
            name: 'GPT-5.2',
            provider: 'openai',
        },
    ],
    ollama: [
        {
            id: 'kimi-k2.5:cloud',
            name: 'Kimi K2.5',
            provider: 'ollama',
        },
        {
            id: 'minimax-m2.5:cloud',
            name: 'MiniMax M2.5',
            provider: 'ollama',
        },
    ],
}

export const PROVIDER_EMBEDDING_MODELS: Record<ProviderType, AIModel[]> = {
    openrouter: [
        {
            id: 'openai/text-embedding-3-small',
            name: 'Embedding 3 Small',
            provider: 'openai',
        },
        {
            id: 'openai/text-embedding-3-large',
            name: 'Embedding 3 Large',
            provider: 'openai',
        },
    ],
    openai: [
        {
            id: 'text-embedding-3-small',
            name: 'Embedding 3 Small',
            provider: 'openai',
        },
        {
            id: 'text-embedding-3-large',
            name: 'Embedding 3 Large',
            provider: 'openai',
        },
    ],
    ollama: [
        {
            id: 'nomic-embed-text',
            name: 'Nomic Embed Text',
            provider: 'ollama',
        },
    ],
}

export const DEFAULT_MODELS: Record<ProviderType, { chat: string; embedding: string }> = {
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
}

export type AIModel = {
    id: string
    name: string
    provider: string
}
