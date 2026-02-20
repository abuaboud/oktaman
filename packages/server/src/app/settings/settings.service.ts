import { Settings, UpdateLlmSettingsRequest, UpdateToolsSettingsRequest, AddSettingsChannelRequest, UpdateSettingsChannelRequest, ValidationResult, SettingsChannelConfig, ProviderConfig, apId, OktaManError, OktaManErrorCode } from '@oktaman/shared';
import { databaseConnection } from '../database/database-connection';
import { SettingsEntitySchema } from './settings.entity';

const settingsRepository = () => databaseConnection.getRepository(SettingsEntitySchema);

const SINGLETON_ID = 'settings_singleton';

async function getOrCreate(): Promise<Settings> {
    let settings = await settingsRepository().findOne({
        where: { id: SINGLETON_ID }
    });

    if (!settings) {
        settings = settingsRepository().create({
            id: SINGLETON_ID,
            provider: null,
            defaultModelId: 'moonshotai/kimi-k2.5',
            embeddingModelId: 'openai/text-embedding-3-small',
            composioApiKey: null,
            composioWebhookSecret: null,
            firecrawlApiKey: null,
            channels: [],
            pairingCode: null,
            setupCompleted: false,
        });

        return await settingsRepository().save(settings);
    }

    return settings;
}

async function updateLlmSettings(request: UpdateLlmSettingsRequest): Promise<Settings> {
    const settings = await getOrCreate();

    if (request.provider !== undefined) {
        settings.provider = request.provider;
    }
    if (request.defaultModelId !== undefined) {
        settings.defaultModelId = request.defaultModelId;
    }
    if (request.embeddingModelId !== undefined) {
        settings.embeddingModelId = request.embeddingModelId;
    }
    await settingsRepository().save(settings);
    return settings;
}

async function updateToolsSettings(request: UpdateToolsSettingsRequest): Promise<Settings> {
    const settings = await getOrCreate();

    if (request.composioApiKey !== undefined) {
        settings.composioApiKey = request.composioApiKey;
    }
    if (request.composioWebhookSecret !== undefined) {
        settings.composioWebhookSecret = request.composioWebhookSecret;
    }
    if (request.firecrawlApiKey !== undefined) {
        settings.firecrawlApiKey = request.firecrawlApiKey;
    }
    await settingsRepository().save(settings);
    return settings;
}

async function addChannel(request: AddSettingsChannelRequest): Promise<Settings> {
    const settings = await getOrCreate();

    const newChannel: SettingsChannelConfig = {
        id: apId(),
        name: request.name,
        type: request.type,
        config: request.config,
        enabled: true,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
    };

    // Replace existing channels of the same type (e.g., only one Telegram bot allowed)
    settings.channels = [...settings.channels.filter(c => c.type !== request.type), newChannel];

    await settingsRepository().save(settings);
    return settings;
}

async function updateChannel(params: UpdateChannelParams): Promise<Settings> {
    const settings = await getOrCreate();

    const channelIndex = settings.channels.findIndex(c => c.id === params.channelId);
    if (channelIndex === -1) {
        throw new OktaManError({
            code: OktaManErrorCode.ENTITY_NOT_FOUND,
            params: { entityType: 'channel', entityId: params.channelId, message: `Channel with id ${params.channelId} not found` }
        });
    }

    const channel = settings.channels[channelIndex];

    if (params.request.name !== undefined) {
        channel.name = params.request.name;
    }
    if (params.request.config !== undefined) {
        channel.config = params.request.config;
    }
    if (params.request.enabled !== undefined) {
        channel.enabled = params.request.enabled;
    }

    channel.updated = new Date().toISOString();
    settings.channels[channelIndex] = channel;

    await settingsRepository().save(settings);
    return settings;
}

async function removeChannel(channelId: string): Promise<Settings> {
    const settings = await getOrCreate();

    const channelIndex = settings.channels.findIndex(c => c.id === channelId);
    if (channelIndex === -1) {
        throw new OktaManError({
            code: OktaManErrorCode.ENTITY_NOT_FOUND,
            params: { entityType: 'channel', entityId: channelId, message: `Channel with id ${channelId} not found` }
        });
    }

    settings.channels = settings.channels.filter(c => c.id !== channelId);

    await settingsRepository().save(settings);
    return settings;
}

async function validateRequired(): Promise<ValidationResult> {
    const settings = await getOrCreate();
    const missing: string[] = [];
    const warnings: string[] = [];

    if (!settings.provider) {
        missing.push('AI provider configuration');
    } else if (settings.provider.type !== 'ollama' && !settings.provider.apiKey) {
        missing.push('API key for ' + settings.provider.type);
    }

    return {
        isValid: missing.length === 0,
        missing,
        warnings,
    };
}

async function getEffectiveApiKey(provider: 'composio' | 'composio-webhook-secret' | 'firecrawl'): Promise<string | undefined> {
    const settings = await getOrCreate();

    switch (provider) {
        case 'composio':
            return settings.composioApiKey || undefined;
        case 'composio-webhook-secret':
            return settings.composioWebhookSecret || undefined;
        case 'firecrawl':
            return settings.firecrawlApiKey || undefined;
        default:
            return undefined;
    }
}

async function getProviderConfig(): Promise<ProviderConfig | null> {
    const settings = await getOrCreate();
    return settings.provider;
}

async function completeSetup(): Promise<Settings> {
    const settings = await getOrCreate();
    settings.setupCompleted = true;
    await settingsRepository().save(settings);
    return settings;
}

async function save(settings: Settings): Promise<Settings> {
    return await settingsRepository().save(settings);
}

export const settingsService = {
    getOrCreate,
    save,
    updateLlmSettings,
    updateToolsSettings,
    addChannel,
    updateChannel,
    removeChannel,
    validateRequired,
    getEffectiveApiKey,
    getProviderConfig,
    completeSetup,
};

type UpdateChannelParams = {
    channelId: string;
    request: UpdateSettingsChannelRequest;
}
