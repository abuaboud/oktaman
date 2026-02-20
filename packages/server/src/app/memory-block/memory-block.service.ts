import { databaseConnection } from '../database/database-connection';
import { apId, MemoryBlock, ProviderConfig } from '@oktaman/shared';
import { MemoryBlockEntitySchema } from './memory-block.entity';
import { embed } from 'ai';
import dayjs from 'dayjs';
import { settingsService } from '../settings/settings.service';
import { createEmbeddingModel } from '../settings/providers';

const memoryBlockRepository = databaseConnection.getRepository<MemoryBlock>(MemoryBlockEntitySchema);

export const memoryBlockService = {
    async store(params: StoreParams): Promise<MemoryBlock> {
        const { content, providerConfig } = params;

        const settings = await settingsService.getOrCreate();
        const embeddingModel = createEmbeddingModel(providerConfig, settings.embeddingModelId);
        const { embedding } = await embed({
            model: embeddingModel,
            value: content,
        });
        const newMemoryBlock: MemoryBlock = {
            id: apId(),
            content,
            embedding,
            created: dayjs().toDate(),
            updated: dayjs().toDate(),
        };

        return memoryBlockRepository.save(newMemoryBlock);
    },

    async forget(params: ForgetParams): Promise<void> {
        const { ids } = params;

        if (ids.length === 0) {
            return;
        }

        await memoryBlockRepository.delete(ids);
    },

    async search(params: SearchParams): Promise<MemoryBlockWithScore[]> {
        const { queryString, minScore = 0.5, providerConfig } = params;

        const settings = await settingsService.getOrCreate();
        const embeddingModel = createEmbeddingModel(providerConfig, settings.embeddingModelId);
        const { embedding } = await embed({
            model: embeddingModel,
            value: queryString,
        });

        // TODO: Integrate sqlite-vss for proper vector similarity search
        // For now, use simple cosine similarity calculation in JavaScript
        const allMemories = await memoryBlockRepository.find();

        const results = allMemories
            .map(memory => ({
                ...memory,
                score: memory.embedding ? cosineSimilarity(embedding, memory.embedding) : 0
            }))
            .filter(memory => memory.score >= minScore)
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);

        return results;
    }
};

function cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
}

type StoreParams = {
    content: string;
    providerConfig: ProviderConfig;
}

type ForgetParams = {
    ids: string[];
}

type SearchParams = {
    queryString: string;
    providerConfig: ProviderConfig;
    minScore?: number;
}

type MemoryBlockWithScore = MemoryBlock & {
    score: number;
}
