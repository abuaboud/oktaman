import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as p from '@clack/prompts'
import { configureProvider } from '../../../src/cli/stages/provider'

vi.mock('@clack/prompts', () => ({
    confirm: vi.fn(),
    select: vi.fn(),
    password: vi.fn(),
    text: vi.fn(),
    isCancel: vi.fn(() => false),
    log: { step: vi.fn(), info: vi.fn(), error: vi.fn() },
    cancel: vi.fn(),
}))

vi.mock('../../../src/cli/api-client', () => ({
    updateLlmSettings: vi.fn(() => Promise.resolve({})),
}))

import { updateLlmSettings } from '../../../src/cli/api-client'

function makeSettings(overrides: Partial<MockSettings> = {}): MockSettings {
    return {
        id: '1',
        provider: null,
        defaultModelId: 'model-1',
        embeddingModelId: 'embed-1',
        composioApiKey: null,
        composioWebhookSecret: null,
        firecrawlApiKey: null,
        channels: [],
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

describe('configureProvider', () => {
    it('should skip when user declines to reconfigure existing provider', async () => {
        const ctx = makeCtx(makeSettings({ provider: { type: 'openrouter' } }))
        vi.mocked(p.confirm).mockResolvedValue(false)

        await configureProvider(ctx)

        expect(p.confirm).toHaveBeenCalledOnce()
        expect(p.select).not.toHaveBeenCalled()
        expect(updateLlmSettings).not.toHaveBeenCalled()
    })

    it('should prompt for API key when provider is openrouter', async () => {
        const ctx = makeCtx()
        vi.mocked(p.select)
            .mockResolvedValueOnce('openrouter')
            .mockResolvedValueOnce('model-chat')
            .mockResolvedValueOnce('model-embed')
        vi.mocked(p.password).mockResolvedValue('sk-test-key')

        await configureProvider(ctx)

        expect(p.password).toHaveBeenCalledWith(
            expect.objectContaining({ message: expect.stringContaining('OpenRouter') })
        )
        expect(updateLlmSettings).toHaveBeenCalledWith(
            expect.objectContaining({
                provider: expect.objectContaining({ type: 'openrouter', apiKey: 'sk-test-key' }),
            })
        )
    })

    it('should prompt for API key when provider is openai', async () => {
        const ctx = makeCtx()
        vi.mocked(p.select)
            .mockResolvedValueOnce('openai')
            .mockResolvedValueOnce('gpt-4')
            .mockResolvedValueOnce('embed-1')
        vi.mocked(p.password).mockResolvedValue('sk-openai-key')

        await configureProvider(ctx)

        expect(p.password).toHaveBeenCalledWith(
            expect.objectContaining({ message: expect.stringContaining('OpenAI') })
        )
        expect(updateLlmSettings).toHaveBeenCalledWith(
            expect.objectContaining({
                provider: expect.objectContaining({ type: 'openai', apiKey: 'sk-openai-key' }),
            })
        )
    })

    it('should prompt for base URL when provider is ollama', async () => {
        const ctx = makeCtx()
        vi.mocked(p.select)
            .mockResolvedValueOnce('ollama')
            .mockResolvedValueOnce('llama3')
            .mockResolvedValueOnce('nomic')
        vi.mocked(p.text).mockResolvedValue('http://localhost:11434')

        await configureProvider(ctx)

        expect(p.text).toHaveBeenCalledWith(
            expect.objectContaining({ message: 'Ollama base URL' })
        )
        expect(updateLlmSettings).toHaveBeenCalledWith(
            expect.objectContaining({
                provider: expect.objectContaining({ type: 'ollama', baseUrl: 'http://localhost:11434' }),
            })
        )
    })

    it('should handle API error gracefully', async () => {
        const ctx = makeCtx()
        vi.mocked(p.select)
            .mockResolvedValueOnce('openrouter')
            .mockResolvedValueOnce('model-chat')
            .mockResolvedValueOnce('model-embed')
        vi.mocked(p.password).mockResolvedValue('sk-key')
        vi.mocked(updateLlmSettings).mockRejectedValue(new Error('Network error'))

        await configureProvider(ctx)

        expect(ctx.spinner.stop).toHaveBeenCalledWith('Failed to save')
        expect(p.log.error).toHaveBeenCalledWith(expect.stringContaining('Network error'))
    })
})

type MockSettings = {
    id: string
    provider: { type: string; apiKey?: string; baseUrl?: string } | null
    defaultModelId: string
    embeddingModelId: string
    composioApiKey: string | null
    composioWebhookSecret: string | null
    firecrawlApiKey: string | null
    channels: { type: string }[]
    setupCompleted: boolean
}
