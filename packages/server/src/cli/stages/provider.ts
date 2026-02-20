import * as p from '@clack/prompts'
import { PROVIDER_MODELS, PROVIDER_EMBEDDING_MODELS, DEFAULT_MODELS, AIModel } from '@oktaman/shared'
import { tryCatch } from '@oktaman/shared'
import { updateLlmSettings } from '../api-client'
import { handleCancel } from '../setup-context'
import type { SetupContext } from '../setup-context'

const PROVIDER_OPTIONS = [
    { value: 'openrouter' as const, label: 'OpenRouter', hint: 'Access many AI models with one API key' },
    { value: 'openai' as const, label: 'OpenAI', hint: 'GPT-5.2' },
    { value: 'ollama' as const, label: 'Ollama', hint: 'Run models locally, no API key needed' },
]

export async function configureProvider(ctx: SetupContext): Promise<void> {
    const { spinner, settings } = ctx
    const hasProviderKey = settings.provider !== null

    let shouldConfigure = true
    if (hasProviderKey) {
        const reconfigure = await p.confirm({
            message: `AI provider is already configured (${settings.provider!.type}). Reconfigure?`,
            initialValue: false,
        })
        if (p.isCancel(reconfigure)) return handleCancel()
        shouldConfigure = reconfigure
    } else {
        p.log.step('Stage 1: AI Provider')
    }

    if (!shouldConfigure) return

    if (hasProviderKey) p.log.step('Stage 1: AI Provider')

    const providerType = await p.select({
        message: 'Choose your AI provider',
        options: PROVIDER_OPTIONS.map((o) => ({
            value: o.value,
            label: o.label,
            hint: o.hint,
        })),
        initialValue: settings.provider?.type ?? 'openrouter',
    })
    if (p.isCancel(providerType)) return handleCancel()

    let apiKey: string | undefined
    let baseUrl: string | undefined

    if (providerType !== 'ollama') {
        const keyLabel = providerType === 'openrouter' ? 'OpenRouter' : 'OpenAI'
        const keyHint = providerType === 'openrouter' ? 'Get yours at openrouter.ai/keys' : 'Get yours at platform.openai.com/api-keys'
        p.log.info(keyHint)
        const keyResult = await p.password({
            message: `Enter your ${keyLabel} API key`,
            validate: (val) => {
                if (!val || val.trim() === '') return 'API key is required'
                return undefined
            },
        })
        if (p.isCancel(keyResult)) return handleCancel()
        apiKey = keyResult
    } else {
        const urlResult = await p.text({
            message: 'Ollama base URL',
            initialValue: settings.provider?.baseUrl ?? 'http://localhost:11434',
            placeholder: 'http://localhost:11434',
        })
        if (p.isCancel(urlResult)) return handleCancel()
        baseUrl = urlResult
    }

    const chatModels: AIModel[] = PROVIDER_MODELS[providerType]
    const defaultChat = DEFAULT_MODELS[providerType].chat

    const chatModelId = await p.select({
        message: 'Choose default chat model',
        options: chatModels.map((m: AIModel) => ({ value: m.id, label: m.name })),
        initialValue: settings.defaultModelId ?? defaultChat,
    })
    if (p.isCancel(chatModelId)) return handleCancel()

    const embeddingModels: AIModel[] = PROVIDER_EMBEDDING_MODELS[providerType]
    const defaultEmbedding = DEFAULT_MODELS[providerType].embedding

    const embeddingModelId = await p.select({
        message: 'Choose embedding model',
        options: embeddingModels.map((m: AIModel) => ({ value: m.id, label: m.name })),
        initialValue: settings.embeddingModelId ?? defaultEmbedding,
    })
    if (p.isCancel(embeddingModelId)) return handleCancel()

    spinner.start('Saving AI provider settings...')
    const [llmError] = await tryCatch(
        updateLlmSettings({
            provider: {
                type: providerType,
                ...(apiKey ? { apiKey } : {}),
                ...(baseUrl ? { baseUrl } : {}),
            },
            defaultModelId: chatModelId,
            embeddingModelId,
        })
    )
    if (llmError) {
        spinner.stop('Failed to save')
        p.log.error(`Failed to save AI settings: ${llmError.message}`)
    } else {
        spinner.stop('AI provider settings saved')
    }
}
