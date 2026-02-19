import { queryCollectionOptions } from '@tanstack/query-db-collection';
import {
  createCollection,
  useLiveSuspenseQuery,
} from '@tanstack/react-db';
import { Channel, CreateChannelRequest } from '@oktaman/shared';
import { api } from '../api';
import { QueryClient } from '@tanstack/react-query';

const collectionQueryClient = new QueryClient();

export const channelCollection = createCollection<Channel, string>(
  queryCollectionOptions({
    queryKey: ['channels'],
    queryClient: collectionQueryClient,
    getKey: (channel) => channel.id,
    queryFn: async () => {
      try {
        const response = await api.get<Channel[]>('/v1/channels');
        if (!Array.isArray(response)) {
          console.error('Expected array from /v1/channels, got:', typeof response, response);
          return [];
        }
        return response;
      } catch (error) {
        console.error('Error fetching channels:', error);
        return [];
      }
    },
    onInsert: async ({ transaction }) => {
      await Promise.all(
        transaction.mutations.map(async (mutation) => {
          if (mutation.type !== 'insert') return;

          const modified = mutation.modified as any;
          const request: CreateChannelRequest = {
            name: modified.name,
            type: modified.type,
            config: modified.config,
          };
          await api.post<Channel>('/v1/channels', request);

        })
      );
      return {
        refetch: true,
      }
    },
    onDelete: async ({ transaction }) => {
      const results = await Promise.allSettled(
        transaction.mutations.map(async (mutation) => {
          if (mutation.type !== 'delete') return;
          await api.delete<void>(`/v1/channels/${mutation.key}`);
        })
      );

      const failures = results.filter((r) => r.status === 'rejected');
      if (failures.length > 0) {
        console.error('Failed to delete some channels:', failures);
        throw new Error(`Failed to delete ${failures.length} channel(s)`);
      }
    },
  }),
);

export const channelHooks = {
  useAll: () => {
    return useLiveSuspenseQuery(
      (q) => q.from({ channel: channelCollection }),
      [],
    );
  },
};
