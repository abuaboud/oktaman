import * as p from '@clack/prompts'
import { PROVIDER_MODELS, PROVIDER_EMBEDDING_MODELS, DEFAULT_MODELS, AIModel } from '@oktaman/shared'
import { tryCatch } from '@oktaman/shared'
import {
    checkHealth,
    getSettings,
    updateLlmSettings,
    updateToolsSettings,
    addChannel,
    generatePairingCode,
    completeSetup,
} from './api-client'

const PROVIDER_OPTIONS = [
    { value: 'openrouter' as const, label: 'OpenRouter', hint: 'Access many AI models with one API key' },
    { value: 'openai' as const, label: 'OpenAI', hint: 'GPT-5.2' },
    { value: 'ollama' as const, label: 'Ollama', hint: 'Run models locally, no API key needed' },
]

async function main() {
    p.intro('OktaMan Setup')

    // Pre-flight: check server
    const s = p.spinner()
    s.start('Checking if OktaMan is running...')
    const healthy = await checkHealth()
    if (!healthy) {
        s.stop('OktaMan is not running')
        p.log.error('Could not connect to OktaMan server.')
        p.log.info('Start it first with: oktaman start')
        p.outro('Setup cancelled')
        process.exit(1)
    }
    s.stop('OktaMan is running')

    // Fetch current settings
    const [settingsError, currentSettings] = await tryCatch(getSettings())
    if (settingsError) {
        p.log.error(`Failed to fetch settings: ${settingsError.message}`)
        p.outro('Setup cancelled')
        process.exit(1)
    }

    const hasProviderKey = currentSettings.provider !== null
    const hasToolsConfig = !!(currentSettings.firecrawlApiKey || currentSettings.composioApiKey)
    const hasTelegram = currentSettings.channels.some((c: { type: string }) => c.type === 'TELEGRAM')

    // ─── Stage 1: AI Provider (required) ───────────────────────────────

    let configureProvider = true
    if (hasProviderKey) {
        const reconfigure = await p.confirm({
            message: `AI provider is already configured (${currentSettings.provider!.type}). Reconfigure?`,
            initialValue: false,
        })
        if (p.isCancel(reconfigure)) return handleCancel()
        configureProvider = reconfigure
    } else {
        p.log.step('Stage 1: AI Provider')
    }

    if (configureProvider) {
        if (hasProviderKey) p.log.step('Stage 1: AI Provider')

        const providerType = await p.select({
            message: 'Choose your AI provider',
            options: PROVIDER_OPTIONS.map((o) => ({
                value: o.value,
                label: o.label,
                hint: o.hint,
            })),
            initialValue: currentSettings.provider?.type ?? 'openrouter',
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
                initialValue: currentSettings.provider?.baseUrl ?? 'http://localhost:11434',
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
            initialValue: currentSettings.defaultModelId ?? defaultChat,
        })
        if (p.isCancel(chatModelId)) return handleCancel()

        const embeddingModels: AIModel[] = PROVIDER_EMBEDDING_MODELS[providerType]
        const defaultEmbedding = DEFAULT_MODELS[providerType].embedding

        const embeddingModelId = await p.select({
            message: 'Choose embedding model',
            options: embeddingModels.map((m: AIModel) => ({ value: m.id, label: m.name })),
            initialValue: currentSettings.embeddingModelId ?? defaultEmbedding,
        })
        if (p.isCancel(embeddingModelId)) return handleCancel()

        s.start('Saving AI provider settings...')
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
            s.stop('Failed to save')
            p.log.error(`Failed to save AI settings: ${llmError.message}`)
        } else {
            s.stop('AI provider settings saved')
        }
    }

    // ─── Stage 2: Tools (optional) ─────────────────────────────────────

    let configureToolsPrompt = 'Configure web scraping & integrations?'
    if (hasToolsConfig) {
        configureToolsPrompt = 'Tools are already configured. Reconfigure?'
    }

    const configureTools = await p.confirm({
        message: configureToolsPrompt,
        initialValue: !hasToolsConfig,
    })
    if (p.isCancel(configureTools)) return handleCancel()

    if (configureTools) {
        p.log.step('Stage 2: Tools')

        // ── Firecrawl ──
        p.log.info(
            'Firecrawl lets OktaMan scrape and read web pages during conversations.\n' +
            '  Get a free API key at firecrawl.dev (500 credits included).'
        )
        const firecrawlKey = await p.password({
            message: 'Firecrawl API key (press Enter to skip)',
        })
        if (p.isCancel(firecrawlKey)) return handleCancel()

        // ── Composio ──
        p.log.info(
            'Composio connects OktaMan to external apps (Gmail, Slack, GitHub, etc.).\n' +
            '  It has two parts:\n' +
            '    1. Tools   — lets the agent take actions (send emails, create issues, etc.)\n' +
            '                 Requires an API key.\n' +
            '    2. Triggers — lets external apps notify OktaMan when something happens\n' +
            '                  (e.g. new email, new PR). Requires a webhook URL + secret.\n' +
            '  Get both at app.composio.dev/settings'
        )
        const composioKey = await p.password({
            message: 'Composio API key — needed for tools (press Enter to skip)',
        })
        if (p.isCancel(composioKey)) return handleCancel()

        let composioWebhookSecret = ''
        if (composioKey) {
            p.log.info(
                'The webhook secret verifies that incoming trigger events are from Composio.\n' +
                '  You also need to paste OktaMan\'s webhook URL into Composio\'s settings.'
            )
            const webhookResult = await p.password({
                message: 'Composio webhook secret — needed for triggers (press Enter to skip)',
            })
            if (p.isCancel(webhookResult)) return handleCancel()
            composioWebhookSecret = webhookResult || ''
        }

        s.start('Saving tools settings...')
        const [toolsError] = await tryCatch(
            updateToolsSettings({
                ...(firecrawlKey ? { firecrawlApiKey: firecrawlKey } : {}),
                ...(composioKey ? { composioApiKey: composioKey } : {}),
                ...(composioWebhookSecret ? { composioWebhookSecret } : {}),
            })
        )
        if (toolsError) {
            s.stop('Failed to save')
            p.log.error(`Failed to save tools settings: ${toolsError.message}`)
        } else {
            s.stop('Tools settings saved')
        }
    }

    // ─── Stage 3: Telegram (optional) ──────────────────────────────────

    let configureTelegram = false

    if (hasTelegram) {
        const reconfigTg = await p.confirm({
            message: 'Telegram bot is already connected. Skip?',
            initialValue: true,
        })
        if (p.isCancel(reconfigTg)) return handleCancel()
        configureTelegram = !reconfigTg
    } else {
        const addTg = await p.confirm({
            message: 'Connect a Telegram bot?',
            initialValue: false,
        })
        if (p.isCancel(addTg)) return handleCancel()
        configureTelegram = addTg
    }

    if (configureTelegram && !hasTelegram) {
        p.log.step('Stage 3: Telegram')
        p.log.info(
            'How to create a Telegram bot:\n' +
            '  1. Open Telegram and search for @BotFather\n' +
            '  2. Send /newbot and follow the prompts\n' +
            '  3. Copy the bot token provided'
        )

        const botToken = await p.password({
            message: 'Enter your Telegram bot token',
            validate: (val) => {
                if (!val || val.trim() === '') return 'Bot token is required'
                return undefined
            },
        })
        if (p.isCancel(botToken)) return handleCancel()

        s.start('Verifying and connecting Telegram bot...')
        const [channelError, channel] = await tryCatch(
            addChannel({
                name: 'Telegram Bot',
                type: 'TELEGRAM',
                config: { botToken, pairedChatId: null },
            })
        )
        if (channelError) {
            s.stop('Failed to connect')
            p.log.error(`Failed to connect Telegram: ${channelError.message}`)
        } else {
            s.stop('Telegram bot connected')

            // Generate pairing code
            s.start('Generating pairing code...')
            const [pairingError, pairing] = await tryCatch(
                generatePairingCode(channel.id)
            )
            if (pairingError) {
                s.stop('Failed to generate code')
                p.log.warn('Bot connected but pairing code failed. Generate one from the UI.')
            } else {
                s.stop('Pairing code ready')
                p.log.success(
                    `Send this code to your bot in Telegram: ${pairing.code.toLowerCase()}\n` +
                    '  The code expires in 10 minutes.'
                )
            }
        }
    }

    // ─── Stage 4: Summary & complete ───────────────────────────────────

    s.start('Completing setup...')
    const [completeError, finalSettings] = await tryCatch(completeSetup())
    if (completeError) {
        s.stop('Warning: could not mark setup complete')
    } else {
        s.stop('Setup complete')
    }

    const summary = finalSettings ?? currentSettings
    p.log.step('Configuration Summary')

    p.log.info(
        `  Provider:   ${summary.provider?.type ?? 'not set'}\n` +
        `  Chat model: ${summary.defaultModelId}\n` +
        `  Embedding:  ${summary.embeddingModelId}\n` +
        `  Firecrawl:  ${summary.firecrawlApiKey ? 'configured' : 'not set'}\n` +
        `  Composio:   ${summary.composioApiKey ? 'configured' : 'not set'}\n` +
        `  Telegram:   ${summary.channels.some((c: { type: string }) => c.type === 'TELEGRAM') ? 'connected' : 'not connected'}`
    )

    p.outro('Run "oktaman open" to launch the web UI')
}

function handleCancel(): void {
    p.cancel('Setup cancelled')
    process.exit(0)
}

main()
