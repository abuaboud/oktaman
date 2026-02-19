import { CreateChannelRequest, ChannelType } from "@oktaman/shared";
import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { channelService } from "./channel.service";
import { telegramChannelHandler } from "./telegram-channel-handler";
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
      await telegramChannelHandler.verifyBotToken(request.body.config.botToken);
    }

    const channel = await channelService.create(request.body);

    // Initialize Telegram bot if it's a Telegram channel
    if (channel.type === ChannelType.TELEGRAM) {
      await telegramChannelHandler.initializeBot(channel);
    }

    return channel;
  });

  // Delete channel
  app.delete('/:channelId', DeleteChannelConfig, async (request) => {
    const channel = await channelService.get(
      request.params.channelId
    );

    // Stop Telegram bot if it's a Telegram channel
    if (channel && channel.type === 'TELEGRAM') {
      await telegramChannelHandler.stopBot(channel.config.botToken)
    }

    await channelService.delete({
      channelId: request.params.channelId
    });
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
    body: CreateChannelRequest,
  },
};

const DeleteChannelConfig = {
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
