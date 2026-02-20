import http from 'node:http'
import { tryCatch } from '@oktaman/shared'

const PORT = parseInt(process.env.OKTAMAN_PORT || '4321', 10)
const BASE = `http://127.0.0.1:${PORT}`

function request<T>(method: string, path: string, body?: unknown): Promise<T> {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE)
        const payload = body ? JSON.stringify(body) : undefined

        const req = http.request(
            {
                hostname: url.hostname,
                port: url.port,
                path: url.pathname,
                method,
                headers: {
                    ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {}),
                },
            },
            (res) => {
                const chunks: Buffer[] = []
                res.on('data', (chunk: Buffer) => chunks.push(chunk))
                res.on('end', () => {
                    const raw = Buffer.concat(chunks).toString()
                    if (!res.statusCode || res.statusCode >= 400) {
                        reject(new Error(`HTTP ${res.statusCode}: ${raw}`))
                        return
                    }
                    if (!raw) {
                        resolve(undefined as T)
                        return
                    }
                    try {
                        resolve(JSON.parse(raw) as T)
                    } catch {
                        resolve(raw as T)
                    }
                })
            }
        )
        req.on('error', reject)
        if (payload) req.write(payload)
        req.end()
    })
}

export async function checkHealth(): Promise<boolean> {
    const [error] = await tryCatch(request('GET', '/health'))
    return !error
}

export function getSettings(): Promise<Settings> {
    return request<Settings>('GET', '/api/v1/settings')
}

export function updateLlmSettings(data: UpdateLlmSettingsRequest): Promise<Settings> {
    return request<Settings>('PUT', '/api/v1/settings/llm', data)
}

export function updateToolsSettings(data: UpdateToolsSettingsRequest): Promise<Settings> {
    return request<Settings>('PUT', '/api/v1/settings/tools', data)
}

export function addChannel(data: AddChannelRequest): Promise<SettingsChannelConfig> {
    return request<SettingsChannelConfig>('POST', '/api/v1/channels', data)
}

export function removeChannel(channelId: string): Promise<unknown> {
    return request('DELETE', `/api/v1/channels/${channelId}`)
}

export function generatePairingCode(channelId: string): Promise<PairingCodeResponse> {
    return request<PairingCodeResponse>('POST', `/api/v1/channels/${channelId}/pairing-code`)
}

export function completeSetup(): Promise<Settings> {
    return request<Settings>('POST', '/api/v1/settings/complete')
}

type ProviderConfig = {
    type: string
    apiKey?: string
    baseUrl?: string
}

type SettingsChannelConfig = {
    id: string
    name: string
    type: string
    config: Record<string, unknown>
    enabled: boolean
    created: string
    updated: string
}

type Settings = {
    id: string
    provider: ProviderConfig | null
    defaultModelId: string
    embeddingModelId: string
    composioApiKey: string | null
    composioWebhookSecret: string | null
    firecrawlApiKey: string | null
    channels: SettingsChannelConfig[]
    setupCompleted: boolean
}

type UpdateLlmSettingsRequest = {
    provider?: ProviderConfig
    defaultModelId?: string
    embeddingModelId?: string
}

type UpdateToolsSettingsRequest = {
    composioApiKey?: string
    composioWebhookSecret?: string
    firecrawlApiKey?: string
}

type AddChannelRequest = {
    name: string
    type: string
    config: Record<string, unknown>
}

type PairingCodeResponse = {
    code: string
    expiresAt: string
}
