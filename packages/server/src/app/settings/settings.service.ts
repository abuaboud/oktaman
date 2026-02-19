import { Settings, UpdateLlmSettingsRequest, UpdateToolsSettingsRequest, AddSettingsChannelRequest, UpdateSettingsChannelRequest, ValidationResult, SettingsChannelConfig, apId, OktaManError, OktaManErrorCode } from '@oktaman/shared';
import { databaseConnection } from '../database/database-connection';
import { SettingsEntitySchema } from './settings.entity';
import * as system from '../common/system';

const settingsRepository = () => databaseConnection.getRepository(SettingsEntitySchema);

const SINGLETON_ID = 'settings_singleton';

function isMaskedKey(key: string): boolean {
    return key.includes('...');
}

async function getOrCreate(): Promise<Settings> {
    let settings = await settingsRepository().findOne({
        where: { id: SINGLETON_ID }
    });

    if (!settings) {
        settings = settingsRepository().create({
            id: SINGLETON_ID,
            openRouterApiKey: system.OPENROUTER_API_KEY || null,
            defaultModelId: 'anthropic/claude-3.5-sonnet',
            embeddingModelId: 'openai/text-embedding-3-small',
            agentModelId: 'moonshotai/kimi-k2.5',
            composioApiKey: system.COMPOSIO_API_KEY || null,
            composioWebhookSecret: system.COMPOSIO_WEBHOOK_SECRET || null,
            firecrawlApiKey: system.FIRECRAWL_API_KEY || null,
            channels: [],
            setupCompleted: false,
        });

        await settingsRepository().save(settings);
    }

    return settings;
}

async function updateLlmSettings(request: UpdateLlmSettingsRequest): Promise<Settings> {
    const settings = await getOrCreate();

    if (request.openRouterApiKey !== undefined && !isMaskedKey(request.openRouterApiKey)) {
        settings.openRouterApiKey = request.openRouterApiKey;
    }
    if (request.defaultModelId !== undefined) {
        settings.defaultModelId = request.defaultModelId;
    }
    if (request.embeddingModelId !== undefined) {
        settings.embeddingModelId = request.embeddingModelId;
    }
    if (request.agentModelId !== undefined) {
        settings.agentModelId = request.agentModelId;
    }

    await settingsRepository().save(settings);
    return settings;
}

async function updateToolsSettings(request: UpdateToolsSettingsRequest): Promise<Settings> {
    const settings = await getOrCreate();

    if (request.composioApiKey !== undefined && !isMaskedKey(request.composioApiKey)) {
        settings.composioApiKey = request.composioApiKey;
    }
    if (request.composioWebhookSecret !== undefined && !isMaskedKey(request.composioWebhookSecret)) {
        settings.composioWebhookSecret = request.composioWebhookSecret;
    }
    if (request.firecrawlApiKey !== undefined && !isMaskedKey(request.firecrawlApiKey)) {
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

    settings.channels = [...settings.channels, newChannel];

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

    const effectiveOpenRouterKey = settings.openRouterApiKey || system.OPENROUTER_API_KEY;

    if (!effectiveOpenRouterKey) {
        missing.push('OpenRouter API key');
    }

    return {
        isValid: missing.length === 0,
        missing,
        warnings,
    };
}

async function getEffectiveApiKey(provider: 'openrouter' | 'composio' | 'composio-webhook-secret' | 'firecrawl'): Promise<string | undefined> {
    const settings = await getOrCreate();

    switch (provider) {
        case 'openrouter':
            return settings.openRouterApiKey || system.OPENROUTER_API_KEY || undefined;
        case 'composio':
            return settings.composioApiKey || system.COMPOSIO_API_KEY || undefined;
        case 'composio-webhook-secret':
            return settings.composioWebhookSecret || system.COMPOSIO_WEBHOOK_SECRET || undefined;
        case 'firecrawl':
            return settings.firecrawlApiKey || system.FIRECRAWL_API_KEY || undefined;
        default:
            return undefined;
    }
}

async function completeSetup(): Promise<Settings> {
    const settings = await getOrCreate();
    settings.setupCompleted = true;
    await settingsRepository().save(settings);
    return settings;
}

export const settingsService = {
    getOrCreate,
    updateLlmSettings,
    updateToolsSettings,
    addChannel,
    updateChannel,
    removeChannel,
    validateRequired,
    getEffectiveApiKey,
    completeSetup,
};

type UpdateChannelParams = {
    channelId: string;
    request: UpdateSettingsChannelRequest;
}
