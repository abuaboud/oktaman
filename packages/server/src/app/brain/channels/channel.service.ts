import { Channel, CreateChannelRequest, UpdateChannelRequest, OktaManError, OktaManErrorCode, apId } from '@oktaman/shared';
import { databaseConnection } from '../../database/database-connection';
import { ChannelEntitySchema } from './channel.entity';

const channelRepository = () => databaseConnection.getRepository(ChannelEntitySchema);

export const channelService = {
  async list(): Promise<Channel[]> {
    const channels = await channelRepository().find({
      order: { created: 'DESC' }
    });
    return channels;
  },

  async get(channelId: string): Promise<Channel | null> {
    return channelRepository().findOne({
      where: { id: channelId }
    });
  },

  async getOrThrow({ channelId }: GetParams): Promise<Channel> {
    const channel = await channelRepository().findOne({
      where: {
        id: channelId,
      }
    });
    if (!channel) {
      throw new OktaManError({
        code: OktaManErrorCode.ENTITY_NOT_FOUND,
        params: { entityType: 'channel', entityId: channelId, message: `Channel with id ${channelId} not found` }
      });
    }
    return channel;
  },

  async create(request: CreateChannelRequest): Promise<Channel> {
    const channel = channelRepository().create({
      id: apId(),
      name: request.name,
      type: request.type,
      config: request.config,
    });

    await channelRepository().save(channel);
    return channel;
  },

  async update({ channelId, request }: UpdateParams): Promise<Channel> {
    const channel = await this.getOrThrow({ channelId });

    if (request.name !== undefined) {
      channel.name = request.name;
    }
    if (request.config !== undefined) {
      channel.config = request.config;
    }

    await channelRepository().save(channel);
    return channel;
  },

  async delete({ channelId }: DeleteParams): Promise<void> {
    const channel = await this.getOrThrow({ channelId });
    await channelRepository().delete(channel.id);
  },

};


type GetParams = {
  channelId: string;
}

type UpdateParams = {
  channelId: string;
  request: UpdateChannelRequest;
}

type DeleteParams = {
  channelId: string;
}