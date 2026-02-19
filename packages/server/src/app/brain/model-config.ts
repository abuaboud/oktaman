export type ModelConfig = {
    maxTokens: number;
    compactionThreshold: number; // Percentage (0-1) at which to trigger compaction
};

export const MODEL_CONFIGS: Record<string, ModelConfig> = {
    // Anthropic models
    'anthropic/claude-opus-4-5': {
        maxTokens: 200000,
        compactionThreshold: 0.8, // Compact at 80% usage
    },
    'anthropic/claude-sonnet-4.5': {
        maxTokens: 200000,
        compactionThreshold: 0.8,
    },

    // Google models
    'google/gemini-3-pro-preview': {
        maxTokens: 1000000,
        compactionThreshold: 0.8,
    },

    // Moonshot AI models
    'moonshotai/kimi-k2.5': {
        maxTokens: 200000,
        compactionThreshold: 0.8,
    },

    // MiniMax models
    'minimax/minimax-m2.5': {
        maxTokens: 245760,
        compactionThreshold: 0.8,
    },
};

/**
 * Get model configuration by model ID
 * Returns a default config if model not found
 */
export function getModelConfig(modelId: string): ModelConfig {
    return MODEL_CONFIGS[modelId] ?? {
        maxTokens: 128000, // Default fallback
        compactionThreshold: 0.8,
    };
}

/**
 * Check if compaction is needed based on token usage
 */
export function needsCompaction(
    inputTokens: number,
    modelId: string
): boolean {
    const config = getModelConfig(modelId);
    const usageRatio = inputTokens / config.maxTokens;
    return usageRatio >= config.compactionThreshold;
}
