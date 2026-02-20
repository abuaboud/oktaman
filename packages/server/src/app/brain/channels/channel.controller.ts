import { AddSettingsChannelRequest, ChannelType } from "@oktaman/shared";
import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { channelService } from "./channel.service";
import { telegramChannelHandler } from "./telegram-channel-handler";
import { telegramPairing } from "./telegram-pairing";
import { settingsService } from "../../settings/settings.service";
import { z } from "zod";

export const channelController: FastifyPluginAsyncZod = async (app) => {

  app.post('/telegram/webhook/:botToken', WebhookConfig, async (request) => {
    const { botToken } = request.params;
    telegramChannelHandler.handleWebhookUpdate(botToken, request.body)
    return { ok: true };
  });

  app.get('/', ListChannelsConfig, async () => {
    return await channelService.list();
  });

  app.get('/:channelId', GetChannelConfig, async (request) => {
    const channel = await channelService.getOrThrow({
      channelId: request.params.channelId
    });
    return channel;
  });

  app.post('/', CreateChannelConfig, async (request) => {
    // Verify Telegram bot token before creating the channel
    if (request.body.type === ChannelType.TELEGRAM) {
      const config = request.body.config as Record<string, unknown>;
      await telegramChannelHandler.verifyBotToken(config.botToken as string);

      // Stop any existing Telegram bot before replacing
      const existingChannels = await channelService.list();
      for (const existing of existingChannels.filter(c => c.type === 'TELEGRAM')) {
        const existingConfig = existing.config as Record<string, unknown>;
        await telegramChannelHandler.stopBot(existingConfig.botToken as string);
      }
    }

    const settings = await settingsService.addChannel(request.body);
    const channel = settings.channels[settings.channels.length - 1];

    // Initialize Telegram bot if it's a Telegram channel
    if (request.body.type === ChannelType.TELEGRAM) {
      await telegramChannelHandler.initializeBot(channel);
    }

    return channel;
  });

  // Generate pairing code
  app.post('/:channelId/pairing-code', PairingCodeConfig, async (request) => {
    await channelService.getOrThrow({ channelId: request.params.channelId });
    const result = await telegramPairing.createCode(request.params.channelId);
    return result;
  });

  // Remove paired chat
  app.delete('/:channelId/paired-chat', RemovePairedChatConfig, async (request) => {
    await channelService.removePairedChat({ channelId: request.params.channelId });
    return { success: true };
  });

  // Delete channel
  app.delete('/:channelId', DeleteChannelConfig, async (request) => {
    const channel = await channelService.get(
      request.params.channelId
    );

    // Stop Telegram bot if it's a Telegram channel
    if (channel && channel.type === 'TELEGRAM') {
      const config = channel.config as Record<string, unknown>;
      await telegramChannelHandler.stopBot(config.botToken as string);
    }

    await settingsService.removeChannel(request.params.channelId);
    return { success: true };
  });
};

const ListChannelsConfig = {
  schema: {
    querystring: z.object({}),
  },
};

const GetChannelConfig = {
  schema: {
    params: z.object({
      channelId: z.string(),
    }),
  },
};

const CreateChannelConfig = {
  schema: {
    body: AddSettingsChannelRequest,
  },
};

const DeleteChannelConfig = {
  schema: {
    params: z.object({
      channelId: z.string(),
    }),
  },
};

const PairingCodeConfig = {
  schema: {
    params: z.object({
      channelId: z.string(),
    }),
  },
};

const RemovePairedChatConfig = {
  schema: {
    params: z.object({
      channelId: z.string(),
    }),
  },
};

const WebhookConfig = {
  schema: {
    params: z.object({
      botToken: z.string(),
    }),
    body: z.object({
      update_id: z.number(),
    }).catchall(z.unknown()),
  },
};
