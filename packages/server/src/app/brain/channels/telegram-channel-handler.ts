import { Bot, Context, InputFile } from 'grammy';
import { Channel, ConversationFile, conversationUtils, isNil, SessionSource, OktaManError, OktaManErrorCode } from '@oktaman/shared';
import { channelService } from './channel.service';
import { logger } from '../../common/logger';
import { sessionService } from '../session.service';
import { API_BASE_URL } from '../../common/system';
import { settingsService } from '../../settings/settings.service';
import { sessionManager } from '../../core/session-manager/session-manager.service';
import * as path from 'path';
import * as fs from 'fs';
import { Update } from 'grammy/types';
import telegramifyMarkdown from 'telegramify-markdown';
import { inspect } from 'util';

const activeBots = new Map<string, Bot>();
const chatSessions = new Map<string, string>();

export const telegramChannelHandler = {

    async verifyBotToken(botToken: string): Promise<void> {
        logger.info('[TelegramHandler] Verifying bot token');

        try {
            const bot = new Bot(botToken);
            const botInfo = await bot.api.getMe();
            logger.info({
                botUsername: botInfo.username,
                botId: botInfo.id
            }, '[TelegramHandler] Bot token verified successfully');
        } catch (error) {
            logger.error({ error: inspect(error) }, '[TelegramHandler] Bot token verification failed');
            throw new OktaManError({
                code: OktaManErrorCode.CONFIGURATION_ERROR,
                params: {
                    message: 'Invalid Telegram bot token. Please check your token and try again.',
                },
            });
        }
    },

    async initializeAllFromDatabase(): Promise<void> {
        logger.info('[TelegramHandler] Initializing all Telegram bots from database');
        const channels = await channelService.list();
        const telegramChannels = channels.filter(channel => channel.type === 'TELEGRAM');

        const results = await Promise.allSettled(
            telegramChannels.map(channel => this.initializeBot(channel))
        );

        const failures = results.filter(r => r.status === 'rejected');
        if (failures.length > 0) {
            logger.error({
                failedCount: failures.length,
                totalCount: telegramChannels.length,
                errors: failures.map(f => (f as PromiseRejectedResult).reason)
            }, '[TelegramHandler] Some bots failed to initialize');
        }

        const successCount = results.filter(r => r.status === 'fulfilled').length;
        logger.info({
            count: successCount,
            total: channels.length,
            failed: failures.length
        }, '[TelegramHandler] Initialized Telegram bots from database');
    },
    async initializeBot(channel: Channel): Promise<void> {
        logger.info({ channelId: channel.id }, '[TelegramHandler] Initializing bot');
        const botToken = channel.config.botToken;

        try {

            // Skip if bot already initialized
            if (activeBots.has(botToken)) {
                logger.info({ channelId: channel.id }, '[TelegramHandler] Bot already initialized');
                return;
            }

            const bot = new Bot(botToken);

            // Handle incoming text messages
            bot.on('message:text', async (ctx) => {
                await handleMessage(ctx, channel);
            });

            // Handle incoming photo messages
            bot.on('message:photo', async (ctx) => {
                await handleMessage(ctx, channel);
            });

            // Store bot before starting to prevent duplicate initialization
            activeBots.set(botToken, bot);

            const useWebhooks = API_BASE_URL.startsWith('https');

            logger.info({ channelId: channel.id }, '[TelegramHandler] Starting bot');
            await setProfilePicture(bot, channel.id);

            if (useWebhooks) {
                // Use webhooks in production (HTTPS)
                // Initialize bot to fetch bot info (required for webhook mode)
                await bot.init();
                const webhookUrl = `${API_BASE_URL}/api/v1/channels/telegram/webhook/${botToken}`;
                await bot.api.setWebhook(webhookUrl);
                logger.info({
                    channelId: channel.id,
                    channelName: channel.name,
                    webhookUrl
                }, '[TelegramHandler] Bot initialized with webhook');
            } else {
                // Use long polling in development
                logger.info({
                    channelId: channel.id,
                    channelName: channel.name
                }, '[TelegramHandler] Bot started with long polling');
                bot.start().catch((error) => {
                    logger.error({ channelId: channel.id, error: inspect(error) }, '[TelegramHandler] Bot failed to start');
                    activeBots.delete(botToken);
                    throw error;
                });

            }
        } catch (error) {
            logger.error({ channelId: channel.id, error: inspect(error) }, '[TelegramHandler] Bot failed to start');
            activeBots.delete(botToken);
            throw error;
        }
    },
    async stopBot(botToken: string): Promise<void> {
        const bot = activeBots.get(botToken);
        if (bot) {
            const useWebhooks = API_BASE_URL.startsWith('https');

            if (useWebhooks) {
                // Delete webhook if using webhooks
                await bot.api.deleteWebhook();
            } else {
                // Stop long polling
                await bot.stop();
            }

            activeBots.delete(botToken);
            logger.info({ botToken: botToken.substring(0, 10) + '...' }, '[TelegramHandler] Bot stopped');
        }
    },
    handleWebhookUpdate(botToken: string, update: Update): void {
        const bot = activeBots.get(botToken);
        if (!bot) {
            logger.warn({ botToken: botToken.substring(0, 10) + '...' }, '[TelegramHandler] Bot not found for webhook update');
            return;
        }
        bot.handleUpdate(update).catch((error) => {
            logger.error({ botToken: botToken.substring(0, 10) + '...', error }, '[TelegramHandler] Error handling webhook update');
        });
    },
    async stopAll(): Promise<void> {
        for (const [botToken, bot] of activeBots.entries()) {
            await bot.stop();
            activeBots.delete(botToken);
        }
        chatSessions.clear();
        logger.info('[TelegramHandler] All bots stopped');
    },
    getLogoPath(): string {
        const logoPath = path.join(__dirname, '../../../assets/logo.png');

        if (!fs.existsSync(logoPath)) {
            throw new Error(`Logo file not found at: ${logoPath}`);
        }

        return logoPath;
    },
};

async function setProfilePicture(bot: Bot, channelId: string): Promise<void> {
    logger.info({ channelId }, '[TelegramHandler] Setting bot profile picture');
    const logoPath = telegramChannelHandler.getLogoPath();

    // Set the bot's profile picture
    const inputFile = new InputFile(logoPath);
    await bot.api.setMyProfilePhoto({
        type: 'static',
        photo: inputFile
    });

    logger.info({ channelId }, '[TelegramHandler] Bot profile picture set successfully');

}


async function handleMessage(ctx: Context, channel: Channel): Promise<void> {
    const chatId = ctx.chat?.id.toString();
    const messageText = ctx.message?.text || ctx.message?.caption || '';
    const photos = ctx.message?.photo;

    // Skip if no text and no photos
    if (!chatId || (!messageText && !photos)) {
        return;
    }

    const bot = activeBots.get(channel.config.botToken);
    const typingActionInterval = setInterval(() => {
        if (bot) {
            try {
                bot.api.sendChatAction(chatId, 'typing');
            } catch (error) {
                logger.error({ chatId, error }, '[TelegramHandler] Error sending typing action');
            }
        }
    }, 5000);

    try {
        const settings = await settingsService.getOrCreate();
        const session = await sessionService.getOrCreateSessionForTelegram({
            modelId: settings.agentModelId,
        });

        const files: ConversationFile[] | undefined = await processPhotos(photos, bot, channel, chatId);

        logger.info({ chatId, messageText, hasPhotos: !!photos, channelId: channel.id, files: files?.length }, '[TelegramHandler] Received message');

        session.conversation = conversationUtils.addUserMessage({
            conversation: session.conversation,
            message: messageText,
            files,
        });
        await sessionService.update({
            id: session.id,
            modelId: settings.agentModelId,
            conversation: session.conversation,
        });

        await sessionManager.enqueueChatProcessing({
            sessionId: session.id,
            sessionSource: SessionSource.TELEGRAM,
            onMessage: async (message) => {
                if (!isNil(message) && message.length > 0) {
                    if (!bot) {
                        logger.warn({ chatId, channelId: channel.id }, '[TelegramHandler] Bot not available for sending message');
                        return;
                    }

                    const telegramMessage = telegramifyMarkdown(message, 'remove');
                    if (telegramMessage.trim().length === 0) {
                        return;
                    }

                    await bot.api.sendMessage(chatId, telegramMessage, {
                        parse_mode: 'MarkdownV2',
                    });
                }
            },
        });
    } catch (error) {
        logger.error({ chatId, channelId: channel.id, error }, '[TelegramHandler] Error handling message');
        if (bot) {
            await bot.api.sendMessage(chatId, 'Sorry, there was an error processing your message. Please try again.');
        }
    } finally {
        clearInterval(typingActionInterval);
    }


}

async function processPhotos(
    photos: TelegramPhotoSize[] | undefined,
    bot: Bot | undefined,
    channel: Channel,
    chatId: string
): Promise<ConversationFile[] | undefined> {
    if (!photos || photos.length === 0) {
        return undefined;
    }

    if (!bot) {
        logger.warn({ chatId, channelId: channel.id }, '[TelegramHandler] Bot not available for photo processing');
        return undefined;
    }

    // Get the largest photo (last in array)
    const largestPhoto = photos[photos.length - 1];
    const fileId = largestPhoto.file_id;

    // Get file info from Telegram
    const file = await bot.api.getFile(fileId);
    if (!file?.file_path) {
        logger.warn({ chatId, fileId }, '[TelegramHandler] File path not available from Telegram');
        return undefined;
    }

    const fileUrl = `https://api.telegram.org/file/bot${channel.config.botToken}/${file.file_path}`;

    // Download the file and convert to base64
    const response = await fetch(fileUrl);
    if (!response.ok) {
        throw new Error(`Failed to download photo from Telegram: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    // Determine MIME type from file extension
    const extension = file.file_path.split('.').pop()?.toLowerCase();
    const extensionToMimeType: Record<string, string> = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
    };
    const mimeType = extensionToMimeType[extension || ''] || 'image/jpeg';

    const dataUrl = `data:${mimeType};base64,${base64}`;

    logger.info({ chatId, fileId, mimeType }, '[TelegramHandler] Processed photo');

    return [{
        name: `photo_${fileId}.${extension || 'jpg'}`,
        type: mimeType,
        url: dataUrl,
    }];
}

type TelegramPhotoSize = {
    file_id: string;
    file_unique_id: string;
    width: number;
    height: number;
    file_size?: number;
};
