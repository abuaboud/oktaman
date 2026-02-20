import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as p from '@clack/prompts'
import { configureTools } from '../../../src/cli/stages/tools'

vi.mock('@clack/prompts', () => ({
    confirm: vi.fn(),
    password: vi.fn(),
    isCancel: vi.fn(() => false),
    log: { step: vi.fn(), info: vi.fn(), error: vi.fn() },
    cancel: vi.fn(),
}))

vi.mock('../../../src/cli/api-client', () => ({
    updateToolsSettings: vi.fn(() => Promise.resolve({})),
}))

import { updateToolsSettings } from '../../../src/cli/api-client'

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

describe('configureTools', () => {
    it('should skip when user declines', async () => {
        const ctx = makeCtx()
        vi.mocked(p.confirm).mockResolvedValue(false)

        await configureTools(ctx)

        expect(p.password).not.toHaveBeenCalled()
        expect(updateToolsSettings).not.toHaveBeenCalled()
    })

    it('should collect firecrawl and composio keys', async () => {
        const ctx = makeCtx()
        vi.mocked(p.confirm).mockResolvedValue(true)
        vi.mocked(p.password)
            .mockResolvedValueOnce('fc-key')     // firecrawl
            .mockResolvedValueOnce('comp-key')   // composio
            .mockResolvedValueOnce('wh-secret')  // webhook secret

        await configureTools(ctx)

        expect(updateToolsSettings).toHaveBeenCalledWith({
            firecrawlApiKey: 'fc-key',
            composioApiKey: 'comp-key',
            composioWebhookSecret: 'wh-secret',
        })
    })

    it('should only prompt webhook secret when composio key provided', async () => {
        const ctx = makeCtx()
        vi.mocked(p.confirm).mockResolvedValue(true)
        vi.mocked(p.password)
            .mockResolvedValueOnce('fc-key')  // firecrawl
            .mockResolvedValueOnce('')        // composio (skipped)

        await configureTools(ctx)

        // Only 2 password prompts: firecrawl + composio (no webhook)
        expect(p.password).toHaveBeenCalledTimes(2)
        expect(updateToolsSettings).toHaveBeenCalledWith({
            firecrawlApiKey: 'fc-key',
        })
    })

    it('should handle API error gracefully', async () => {
        const ctx = makeCtx()
        vi.mocked(p.confirm).mockResolvedValue(true)
        vi.mocked(p.password)
            .mockResolvedValueOnce('fc-key')
            .mockResolvedValueOnce('')
        vi.mocked(updateToolsSettings).mockRejectedValue(new Error('Save failed'))

        await configureTools(ctx)

        expect(ctx.spinner.stop).toHaveBeenCalledWith('Failed to save')
        expect(p.log.error).toHaveBeenCalledWith(expect.stringContaining('Save failed'))
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
    channels: { type: string }[]
    setupCompleted: boolean
}
