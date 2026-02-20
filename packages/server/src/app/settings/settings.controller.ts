import { UpdateLlmSettingsRequest, UpdateToolsSettingsRequest, AddSettingsChannelRequest, UpdateSettingsChannelRequest } from "@oktaman/shared";
import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { settingsService } from "./settings.service";
import { telegramChannelHandler } from "../brain/channels/telegram-channel-handler";
import { z } from "zod";

export const settingsController: FastifyPluginAsyncZod = async (app) => {

    app.get('/', GetSettingsConfig, async () => {
        return await settingsService.getOrCreate();
    });

    app.get('/validation', ValidationConfig, async () => {
        return await settingsService.validateRequired();
    });

    app.put('/llm', UpdateLlmConfig, async (request) => {
        return await settingsService.updateLlmSettings(request.body);
    });

    app.put('/tools', UpdateToolsConfig, async (request) => {
        return await settingsService.updateToolsSettings(request.body);
    });

    app.post('/channels', AddChannelConfig, async (request) => {
        // Verify Telegram bot token before adding
        if (request.body.type === 'TELEGRAM') {
            const botToken = request.body.config.botToken as string;
            await telegramChannelHandler.verifyBotToken(botToken);
        }

        const settings = await settingsService.addChannel(request.body);

        // Initialize bot if Telegram
        if (request.body.type === 'TELEGRAM') {
            const botToken = (request.body.config as Record<string, unknown>).botToken as string;
            const channel = settings.channels.find(c => c.type === 'TELEGRAM' && (c.config as Record<string, unknown>).botToken === botToken);
            if (channel) {
                await telegramChannelHandler.initializeBot(channel);
            }
        }

        return settings;
    });

    app.put('/channels/:channelId', UpdateChannelConfig, async (request) => {
        return await settingsService.updateChannel({
            channelId: request.params.channelId,
            request: request.body
        });
    });

    app.delete('/channels/:channelId', DeleteChannelConfig, async (request) => {
        const settings = await settingsService.getOrCreate();
        const channel = settings.channels.find(c => c.id === request.params.channelId);

        // Stop Telegram bot if applicable
        if (channel?.type === 'TELEGRAM') {
            await telegramChannelHandler.stopBot(channel.config.botToken as string);
        }

        return await settingsService.removeChannel(request.params.channelId);
    });

    app.post('/complete', CompleteSetupConfig, async () => {
        return await settingsService.completeSetup();
    });
};

const GetSettingsConfig = {
    schema: {
        response: {
            200: z.any()
        }
    }
};

const ValidationConfig = {
    schema: {
        response: {
            200: z.any()
        }
    }
};

const UpdateLlmConfig = {
    schema: {
        body: UpdateLlmSettingsRequest,
        response: {
            200: z.any()
        }
    }
};

const UpdateToolsConfig = {
    schema: {
        body: UpdateToolsSettingsRequest,
        response: {
            200: z.any()
        }
    }
};

const AddChannelConfig = {
    schema: {
        body: AddSettingsChannelRequest,
        response: {
            200: z.any()
        }
    }
};

const UpdateChannelConfig = {
    schema: {
        params: z.object({
            channelId: z.string(),
        }),
        body: UpdateSettingsChannelRequest,
        response: {
            200: z.any()
        }
    }
};

const DeleteChannelConfig = {
    schema: {
        params: z.object({
            channelId: z.string(),
        }),
        response: {
            200: z.any()
        }
    }
};

const CompleteSetupConfig = {
    schema: {
        response: {
            200: z.any()
        }
    }
};
