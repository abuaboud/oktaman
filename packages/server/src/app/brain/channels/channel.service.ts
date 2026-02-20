import { SettingsChannelConfig, OktaManError, OktaManErrorCode } from '@oktaman/shared';
import { settingsService } from '../../settings/settings.service';

export const channelService = {
  async list(): Promise<SettingsChannelConfig[]> {
    const settings = await settingsService.getOrCreate();
    return [...settings.channels].sort((a, b) => b.created.localeCompare(a.created));
  },

  async get(channelId: string): Promise<SettingsChannelConfig | null> {
    const settings = await settingsService.getOrCreate();
    return settings.channels.find(c => c.id === channelId) ?? null;
  },

  async getOrThrow({ channelId }: GetParams): Promise<SettingsChannelConfig> {
    const channel = await this.get(channelId);
    if (!channel) {
      throw new OktaManError({
        code: OktaManErrorCode.ENTITY_NOT_FOUND,
        params: { entityType: 'channel', entityId: channelId, message: `Channel with id ${channelId} not found` }
      });
    }
    return channel;
  },

  async setPairedChat({ channelId, chatId }: SetPairedChatParams): Promise<void> {
    const channel = await this.getOrThrow({ channelId });
    const config = channel.config as Record<string, unknown>;
    await settingsService.updateChannel({
      channelId,
      request: { config: { ...config, pairedChatId: chatId } },
    });
  },

  async removePairedChat({ channelId }: RemovePairedChatParams): Promise<void> {
    const channel = await this.getOrThrow({ channelId });
    const config = channel.config as Record<string, unknown>;
    await settingsService.updateChannel({
      channelId,
      request: { config: { ...config, pairedChatId: null } },
    });
  },
};

type GetParams = {
  channelId: string;
}

type SetPairedChatParams = {
  channelId: string;
  chatId: string;
}

type RemovePairedChatParams = {
  channelId: string;
}
