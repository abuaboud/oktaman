import { Bot, Context, InputFile } from 'grammy';
import { ConversationFile, conversationUtils, SessionSource, SettingsChannelConfig, OktaManError, OktaManErrorCode, tryCatch, getToolCallLabelText, ToolCallConversationMessage } from '@oktaman/shared';
import { channelService } from './channel.service';
import { logger } from '../../common/logger';
import { sessionService } from '../session/session.service';
import { API_BASE_URL } from '../../common/system';
import { settingsService } from '../../settings/settings.service';
import { sessionManager } from '../../core/session-manager/session-manager.service';
import * as path from 'path';
import * as fs from 'fs';
import { Update } from 'grammy/types';

import { inspect } from 'util';
import { sanitizeMarkdown } from 'telegram-markdown-sanitizer';
import { telegramPairing } from './telegram-pairing';

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

        // Only initialize the most recent Telegram channel (there should only be one)
        const latestTelegramChannel = telegramChannels[0];
        if (!latestTelegramChannel) {
            logger.info('[TelegramHandler] No Telegram channels found');
            return;
        }

        const [error] = await tryCatch(this.initializeBot(latestTelegramChannel));
        if (error) {
            logger.error({
                channelId: latestTelegramChannel.id,
                error: inspect(error),
            }, '[TelegramHandler] Failed to initialize Telegram bot');
            return;
        }

        logger.info({
            channelId: latestTelegramChannel.id,
        }, '[TelegramHandler] Initialized Telegram bot from database');
    },
    async initializeBot(channel: SettingsChannelConfig): Promise<void> {
        logger.info({ channelId: channel.id }, '[TelegramHandler] Initializing bot');
        const botToken = getChannelBotToken(channel);

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


async function handleMessage(ctx: Context, channel: SettingsChannelConfig): Promise<void> {
    const chatId = ctx.chat?.id.toString();
    const messageText = ctx.message?.text || ctx.message?.caption || '';
    const photos = ctx.message?.photo;

    // Skip if no text and no photos
    if (!chatId || (!messageText && !photos)) {
        return;
    }

    const botToken = getChannelBotToken(channel);
    const bot = activeBots.get(botToken);

    const pairingResult = await enforcePairing({ channelId: channel.id, chatId, messageText, bot });
    if (!pairingResult.authorized) {
        return;
    }

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
            modelId: settings.defaultModelId,
        });

        const files: ConversationFile[] | undefined = await processPhotos(photos, bot, botToken, chatId);

        logger.info({ chatId, messageText, hasPhotos: !!photos, channelId: channel.id, files: files?.length }, '[TelegramHandler] Received message');

        session.conversation = conversationUtils.addUserMessage({
            conversation: session.conversation,
            message: messageText,
            files,
        });
        await sessionService.update({
            id: session.id,
            modelId: settings.defaultModelId,
            conversation: session.conversation,
        });

        await sessionManager.enqueueChatProcessing({
            sessionId: session.id,
            sessionSource: SessionSource.TELEGRAM,
            onMessage: async (parts) => {
                if (!bot) {
                    logger.warn({ chatId, channelId: channel.id }, '[TelegramHandler] Bot not available for sending message');
                    return;
                }

                for (const part of parts) {
                    if (part.type === 'text') {
                        if (part.message.trim().length === 0) {
                            continue;
                        }
                        const telegramMessage = toTelegramMarkdown(part.message);
                        if (telegramMessage.trim().length === 0) {
                            continue;
                        }
                        await bot.api.sendMessage(chatId, telegramMessage, {
                            parse_mode: 'MarkdownV2',
                        });
                    } else if (part.type === 'tool-call') {
                        const label = getToolCallLabelText(part as ToolCallConversationMessage);
                        const escaped = toTelegramMarkdown(label);
                        if (escaped.trim().length > 0) {
                            await bot.api.sendMessage(chatId, escaped, {
                                parse_mode: 'MarkdownV2',
                            });
                        }
                    } else if (part.type === 'assistant-attachment') {
                        try {
                            const photoSource = resolvePhotoSource(part.url);
                            await bot.api.sendPhoto(chatId, photoSource, {
                                caption: part.altText || undefined,
                            });
                        } catch (photoError) {
                            logger.warn({ chatId, url: part.url, error: inspect(photoError) }, '[TelegramHandler] Failed to send photo, falling back to text link');
                            const fallback = part.altText
                                ? `[${part.altText}](${part.url})`
                                : part.url;
                            await bot.api.sendMessage(chatId, fallback);
                        }
                    }
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
    botToken: string,
    chatId: string
): Promise<ConversationFile[] | undefined> {
    if (!photos || photos.length === 0) {
        return undefined;
    }

    if (!bot) {
        logger.warn({ chatId }, '[TelegramHandler] Bot not available for photo processing');
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

    const fileUrl = `https://api.telegram.org/file/bot${botToken}/${file.file_path}`;

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

function resolvePhotoSource(url: string): string | InputFile {
    const ATTACHMENT_VIEW_PREFIX = '/api/v1/attachments/view?path='
    if (url.startsWith(ATTACHMENT_VIEW_PREFIX)) {
        const localPath = decodeURIComponent(url.slice(ATTACHMENT_VIEW_PREFIX.length))
        return new InputFile(localPath)
    }
    if (url.startsWith('/api/') || url.startsWith('/v1/')) {
        return `${API_BASE_URL}${url}`
    }
    return url
}

function getChannelBotToken(channel: SettingsChannelConfig): string {
    const config = channel.config as Record<string, unknown>;
    return config.botToken as string;
}

async function enforcePairing({ channelId, chatId, messageText, bot }: EnforcePairingParams): Promise<EnforcePairingResult> {
    const settings = await settingsService.getOrCreate();
    const freshChannel = settings.channels.find(c => c.id === channelId);
    if (!freshChannel) {
        return { authorized: false };
    }

    const config = freshChannel.config as Record<string, unknown>;
    const pairedChatId = (config.pairedChatId as string | null) ?? null;

    if (pairedChatId === chatId) {
        return { authorized: true };
    }

    if (await attemptPairingByCode({ code: messageText, channel: freshChannel })) {
        await channelService.setPairedChat({ channelId: freshChannel.id, chatId });
        if (bot) {
            await bot.api.sendMessage(chatId, 'Successfully paired! You can now chat with the AI agent.');
        }
        return { authorized: false };
    }

    if (bot) {
        await bot.api.sendMessage(chatId, 'You are not authorized to use this bot. Please enter a valid pairing code.');
    }
    return { authorized: false };
}

async function attemptPairingByCode({ code, channel }: AttemptPairingParams): Promise<boolean> {
    const result = await telegramPairing.validateCode(code);
    return result !== null && result.channelId === channel.id;
}

export function toTelegramMarkdown(markdown: string): string {
    return sanitizeMarkdown(markdown);
}

type TelegramPhotoSize = {
    file_id: string;
    file_unique_id: string;
    width: number;
    height: number;
    file_size?: number;
};

type EnforcePairingParams = {
    channelId: string;
    chatId: string;
    messageText: string;
    bot: Bot | undefined;
};

type EnforcePairingResult = {
    authorized: boolean;
};

type AttemptPairingParams = {
    code: string;
    channel: SettingsChannelConfig;
};
