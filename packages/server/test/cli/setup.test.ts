import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@clack/prompts', () => ({
    intro: vi.fn(),
    outro: vi.fn(),
    spinner: vi.fn(() => ({ start: vi.fn(), stop: vi.fn() })),
    log: { error: vi.fn(), info: vi.fn() },
    cancel: vi.fn(),
}))

vi.mock('../../src/cli/api-client', () => ({
    checkHealth: vi.fn(),
    getSettings: vi.fn(),
}))

vi.mock('../../src/cli/stages/provider', () => ({
    configureProvider: vi.fn(),
}))

vi.mock('../../src/cli/stages/tools', () => ({
    configureTools: vi.fn(),
}))

vi.mock('../../src/cli/stages/telegram', () => ({
    configureTelegram: vi.fn(),
}))

vi.mock('../../src/cli/stages/summary', () => ({
    completeSummary: vi.fn(),
}))

import { checkHealth, getSettings } from '../../src/cli/api-client'
import { configureProvider } from '../../src/cli/stages/provider'
import { configureTools } from '../../src/cli/stages/tools'
import { configureTelegram } from '../../src/cli/stages/telegram'
import { completeSummary } from '../../src/cli/stages/summary'
import { main } from '../../src/cli/setup'

const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

const DEFAULT_SETTINGS = {
    id: '1',
    provider: null,
    defaultModelId: 'model-1',
    embeddingModelId: 'embed-1',
    composioApiKey: null,
    composioWebhookSecret: null,
    firecrawlApiKey: null,
    channels: [],
    setupCompleted: false,
}

beforeEach(() => {
    vi.clearAllMocks()
    mockExit.mockClear()
})

describe('setup orchestrator', () => {
    it('should exit if health check fails', async () => {
        vi.mocked(checkHealth).mockResolvedValue(false)

        await main()

        expect(mockExit).toHaveBeenCalledWith(1)
        expect(configureProvider).not.toHaveBeenCalled()
    })

    it('should exit if settings fetch fails', async () => {
        vi.mocked(checkHealth).mockResolvedValue(true)
        vi.mocked(getSettings).mockRejectedValue(new Error('DB error'))

        await main()

        expect(mockExit).toHaveBeenCalledWith(1)
        expect(configureProvider).not.toHaveBeenCalled()
    })

    it('should call all 4 stages in order', async () => {
        vi.mocked(checkHealth).mockResolvedValue(true)
        vi.mocked(getSettings).mockResolvedValue(DEFAULT_SETTINGS as never)

        const callOrder: string[] = []
        vi.mocked(configureProvider).mockImplementation(async () => { callOrder.push('provider') })
        vi.mocked(configureTools).mockImplementation(async () => { callOrder.push('tools') })
        vi.mocked(configureTelegram).mockImplementation(async () => { callOrder.push('telegram') })
        vi.mocked(completeSummary).mockImplementation(async () => { callOrder.push('summary') })

        await main()

        expect(callOrder).toEqual(['provider', 'tools', 'telegram', 'summary'])
    })
})
