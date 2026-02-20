import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as p from '@clack/prompts'
import { completeSummary } from '../../../src/cli/stages/summary'

vi.mock('@clack/prompts', () => ({
    log: { step: vi.fn(), info: vi.fn() },
}))

vi.mock('../../../src/cli/api-client', () => ({
    completeSetup: vi.fn(() => Promise.resolve(null)),
}))

import { completeSetup } from '../../../src/cli/api-client'

function makeSettings(overrides: Partial<MockSettings> = {}): MockSettings {
    return {
        id: '1',
        provider: { type: 'openrouter' },
        defaultModelId: 'model-1',
        embeddingModelId: 'embed-1',
        composioApiKey: null,
        composioWebhookSecret: null,
        firecrawlApiKey: 'fc-key',
        channels: [{ type: 'TELEGRAM', id: 'ch-1', name: 'Bot', config: {}, enabled: true, created: '', updated: '' }],
        setupCompleted: false,
        ...overrides,
    }
}

function makeCtx(settings?: MockSettings) {
    return {
        spinner: { start: vi.fn(), stop: vi.fn() },
        settings: settings ?? makeSettings(),
    }
}

beforeEach(() => {
    vi.clearAllMocks()
})

describe('completeSummary', () => {
    it('should call completeSetup', async () => {
        const ctx = makeCtx()
        await completeSummary(ctx)
        expect(completeSetup).toHaveBeenCalledOnce()
    })

    it('should display correct summary from final settings', async () => {
        const finalSettings = makeSettings({
            provider: { type: 'openai' },
            defaultModelId: 'gpt-4',
            embeddingModelId: 'text-embed-3',
            firecrawlApiKey: 'fc-123',
            composioApiKey: 'comp-123',
        })
        vi.mocked(completeSetup).mockResolvedValue(finalSettings as never)
        const ctx = makeCtx()

        await completeSummary(ctx)

        expect(p.log.info).toHaveBeenCalledWith(expect.stringContaining('openai'))
        expect(p.log.info).toHaveBeenCalledWith(expect.stringContaining('gpt-4'))
        expect(p.log.info).toHaveBeenCalledWith(expect.stringContaining('configured'))
    })

    it('should use fallback settings when completeSetup fails', async () => {
        vi.mocked(completeSetup).mockRejectedValue(new Error('fail'))
        const ctx = makeCtx(makeSettings({
            provider: { type: 'ollama' },
            defaultModelId: 'llama3',
        }))

        await completeSummary(ctx)

        expect(ctx.spinner.stop).toHaveBeenCalledWith('Warning: could not mark setup complete')
        expect(p.log.info).toHaveBeenCalledWith(expect.stringContaining('ollama'))
        expect(p.log.info).toHaveBeenCalledWith(expect.stringContaining('llama3'))
    })
})

type MockSettings = {
    id: string
    provider: { type: string } | null
    defaultModelId: string
    embeddingModelId: string
    composioApiKey: string | null
    composioWebhookSecret: string | null
    firecrawlApiKey: string | null
    channels: { type: string; id?: string; name?: string; config?: Record<string, unknown>; enabled?: boolean; created?: string; updated?: string }[]
    setupCompleted: boolean
}
