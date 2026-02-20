import { describe, it, expect, vi, beforeEach } from 'vitest'
import http from 'node:http'
import {
    checkHealth,
    getSettings,
    updateLlmSettings,
    updateToolsSettings,
    addChannel,
    generatePairingCode,
    completeSetup,
    removeChannel,
} from '../../src/cli/api-client'

vi.mock('node:http', () => {
    const mockRequest = vi.fn()
    return { default: { request: mockRequest }, request: mockRequest }
})

const mockRequest = vi.mocked(http.request)

function fakeResponse(statusCode: number, body: string) {
    return (_opts: unknown, cb: (res: FakeIncomingMessage) => void) => {
        const res = {
            statusCode,
            on: vi.fn((event: string, handler: (chunk?: Buffer) => void) => {
                if (event === 'data') handler(Buffer.from(body))
                if (event === 'end') handler()
            }),
        }
        cb(res as FakeIncomingMessage)
        return {
            on: vi.fn(),
            write: vi.fn(),
            end: vi.fn(),
        }
    }
}

function fakeErrorResponse() {
    return () => {
        const req = {
            on: vi.fn((event: string, handler: (err: Error) => void) => {
                if (event === 'error') handler(new Error('ECONNREFUSED'))
            }),
            write: vi.fn(),
            end: vi.fn(),
        }
        return req
    }
}

beforeEach(() => {
    vi.clearAllMocks()
})

describe('api-client', () => {
    describe('checkHealth', () => {
        it('should return true on 200', async () => {
            mockRequest.mockImplementation(fakeResponse(200, '{"status":"ok"}') as never)
            const result = await checkHealth()
            expect(result).toBe(true)
        })

        it('should return false on connection error', async () => {
            mockRequest.mockImplementation(fakeErrorResponse() as never)
            const result = await checkHealth()
            expect(result).toBe(false)
        })
    })

    describe('getSettings', () => {
        it('should parse JSON response', async () => {
            const settings = {
                id: '1',
                provider: { type: 'openrouter' },
                defaultModelId: 'model-1',
                embeddingModelId: 'embed-1',
                composioApiKey: null,
                composioWebhookSecret: null,
                firecrawlApiKey: null,
                channels: [],
                setupCompleted: false,
            }
            mockRequest.mockImplementation(fakeResponse(200, JSON.stringify(settings)) as never)
            const result = await getSettings()
            expect(result).toEqual(settings)
        })

        it('should reject on HTTP 500', async () => {
            mockRequest.mockImplementation(fakeResponse(500, 'Internal Server Error') as never)
            await expect(getSettings()).rejects.toThrow('HTTP 500')
        })
    })

    describe('updateLlmSettings', () => {
        it('should send PUT with correct body', async () => {
            const updatedSettings = {
                id: '1',
                provider: { type: 'openai', apiKey: 'key123' },
                defaultModelId: 'gpt-4',
                embeddingModelId: 'embed-1',
                composioApiKey: null,
                composioWebhookSecret: null,
                firecrawlApiKey: null,
                channels: [],
                setupCompleted: false,
            }
            mockRequest.mockImplementation(fakeResponse(200, JSON.stringify(updatedSettings)) as never)

            const result = await updateLlmSettings({
                provider: { type: 'openai', apiKey: 'key123' },
                defaultModelId: 'gpt-4',
            })
            expect(result).toEqual(updatedSettings)

            const callArgs = mockRequest.mock.calls[0][0] as { method: string; path: string }
            expect(callArgs.method).toBe('PUT')
            expect(callArgs.path).toBe('/api/v1/settings/llm')
        })
    })

    describe('updateToolsSettings', () => {
        it('should send PUT with tools payload', async () => {
            const response = { id: '1', firecrawlApiKey: 'fc-key' }
            mockRequest.mockImplementation(fakeResponse(200, JSON.stringify(response)) as never)

            await updateToolsSettings({ firecrawlApiKey: 'fc-key' })

            const callArgs = mockRequest.mock.calls[0][0] as { method: string; path: string }
            expect(callArgs.method).toBe('PUT')
            expect(callArgs.path).toBe('/api/v1/settings/tools')
        })
    })

    describe('addChannel', () => {
        it('should send POST and return parsed channel', async () => {
            const channel = {
                id: 'ch-1',
                name: 'Telegram Bot',
                type: 'TELEGRAM',
                config: { botToken: 'tok' },
                enabled: true,
                created: '2026-01-01',
                updated: '2026-01-01',
            }
            mockRequest.mockImplementation(fakeResponse(200, JSON.stringify(channel)) as never)

            const result = await addChannel({
                name: 'Telegram Bot',
                type: 'TELEGRAM',
                config: { botToken: 'tok', pairedChatId: null },
            })
            expect(result).toEqual(channel)

            const callArgs = mockRequest.mock.calls[0][0] as { method: string; path: string }
            expect(callArgs.method).toBe('POST')
            expect(callArgs.path).toBe('/api/v1/channels')
        })
    })

    describe('removeChannel', () => {
        it('should send DELETE', async () => {
            mockRequest.mockImplementation(fakeResponse(200, '') as never)
            await removeChannel('ch-1')

            const callArgs = mockRequest.mock.calls[0][0] as { method: string; path: string }
            expect(callArgs.method).toBe('DELETE')
            expect(callArgs.path).toBe('/api/v1/channels/ch-1')
        })
    })

    describe('generatePairingCode', () => {
        it('should return code and expiresAt', async () => {
            const pairing = { code: 'ABC123', expiresAt: '2026-01-01T01:00:00Z' }
            mockRequest.mockImplementation(fakeResponse(200, JSON.stringify(pairing)) as never)

            const result = await generatePairingCode('ch-1')
            expect(result).toEqual(pairing)

            const callArgs = mockRequest.mock.calls[0][0] as { method: string; path: string }
            expect(callArgs.method).toBe('POST')
            expect(callArgs.path).toBe('/api/v1/channels/ch-1/pairing-code')
        })
    })

    describe('completeSetup', () => {
        it('should send POST and return settings', async () => {
            const settings = { id: '1', setupCompleted: true }
            mockRequest.mockImplementation(fakeResponse(200, JSON.stringify(settings)) as never)

            const result = await completeSetup()
            expect(result).toEqual(settings)

            const callArgs = mockRequest.mock.calls[0][0] as { method: string; path: string }
            expect(callArgs.method).toBe('POST')
            expect(callArgs.path).toBe('/api/v1/settings/complete')
        })

        it('should reject on HTTP 500', async () => {
            mockRequest.mockImplementation(fakeResponse(500, 'Server Error') as never)
            await expect(completeSetup()).rejects.toThrow('HTTP 500')
        })
    })
})

type FakeIncomingMessage = {
    statusCode: number
    on: ReturnType<typeof vi.fn>
}
