import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as p from '@clack/prompts'
import { configureTelegram } from '../../../src/cli/stages/telegram'

vi.mock('@clack/prompts', () => ({
    confirm: vi.fn(),
    password: vi.fn(),
    isCancel: vi.fn(() => false),
    log: { step: vi.fn(), info: vi.fn(), error: vi.fn(), warn: vi.fn(), message: vi.fn() },
    cancel: vi.fn(),
}))

vi.mock('../../../src/cli/api-client', () => ({
    addChannel: vi.fn(() => Promise.resolve({ id: 'ch-1' })),
    generatePairingCode: vi.fn(() => Promise.resolve({ code: 'ABCDEF', expiresAt: '2026-01-01T01:00:00Z' })),
}))

import { addChannel, generatePairingCode } from '../../../src/cli/api-client'

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

describe('configureTelegram', () => {
    it('should skip when user chooses to skip existing connection', async () => {
        const ctx = makeCtx(makeSettings({ channels: [{ type: 'TELEGRAM' }] }))
        vi.mocked(p.confirm).mockResolvedValue(true) // "Skip?" -> Yes

        await configureTelegram(ctx)

        expect(addChannel).not.toHaveBeenCalled()
    })

    it('should proceed when user says "No" to skip (reconfigure)', async () => {
        const ctx = makeCtx(makeSettings({ channels: [{ type: 'TELEGRAM' }] }))
        vi.mocked(p.confirm).mockResolvedValue(false) // "Skip?" -> No
        vi.mocked(p.password).mockResolvedValue('bot-token-123')

        await configureTelegram(ctx)

        expect(addChannel).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'TELEGRAM',
                config: expect.objectContaining({ botToken: 'bot-token-123' }),
            })
        )
        expect(generatePairingCode).toHaveBeenCalledWith('ch-1')
    })

    it('should skip when user declines to connect new bot', async () => {
        const ctx = makeCtx()
        vi.mocked(p.confirm).mockResolvedValue(false) // "Connect?" -> No

        await configureTelegram(ctx)

        expect(addChannel).not.toHaveBeenCalled()
    })

    it('should call addChannel then generatePairingCode on success', async () => {
        const ctx = makeCtx()
        vi.mocked(p.confirm).mockResolvedValue(true)
        vi.mocked(p.password).mockResolvedValue('bot-token-xyz')

        await configureTelegram(ctx)

        expect(addChannel).toHaveBeenCalledOnce()
        expect(generatePairingCode).toHaveBeenCalledWith('ch-1')
        expect(p.log.message).toHaveBeenCalledWith(expect.stringContaining('abcdef'))
    })

    it('should handle channel creation error', async () => {
        const ctx = makeCtx()
        vi.mocked(p.confirm).mockResolvedValue(true)
        vi.mocked(p.password).mockResolvedValue('bot-token')
        vi.mocked(addChannel).mockRejectedValue(new Error('Invalid token'))

        await configureTelegram(ctx)

        expect(ctx.spinner.stop).toHaveBeenCalledWith('Failed to connect')
        expect(p.log.error).toHaveBeenCalledWith(expect.stringContaining('Invalid token'))
        expect(generatePairingCode).not.toHaveBeenCalled()
    })

    it('should handle pairing code generation error', async () => {
        const ctx = makeCtx()
        vi.mocked(p.confirm).mockResolvedValue(true)
        vi.mocked(p.password).mockResolvedValue('bot-token')
        vi.mocked(addChannel).mockResolvedValue({ id: 'ch-1' } as never)
        vi.mocked(generatePairingCode).mockRejectedValue(new Error('Code gen failed'))

        await configureTelegram(ctx)

        expect(ctx.spinner.stop).toHaveBeenCalledWith('Failed to generate code')
        expect(p.log.warn).toHaveBeenCalledWith(expect.stringContaining('pairing code failed'))
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
