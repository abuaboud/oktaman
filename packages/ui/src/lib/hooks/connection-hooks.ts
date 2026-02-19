import { queryCollectionOptions } from '@tanstack/query-db-collection';
import {
  createCollection,
  useLiveSuspenseQuery,
} from '@tanstack/react-db';
import { Connection } from '@oktaman/shared';
import { api } from '../api';
import { QueryClient } from '@tanstack/react-query';

const collectionQueryClient = new QueryClient();

export const connectionCollection = createCollection<Connection, string>(
  queryCollectionOptions({
    queryKey: ['connections'],
    queryClient: collectionQueryClient,
    getKey: (connection) => connection.slug,
    refetchInterval: 5000,
    queryFn: async () => {
      const response = await api.get<Connection[]>('/api/v1/connections');
      return response;
    },
    onDelete: async ({ transaction }) => {
      const mutation = transaction.mutations[0];
      if (!mutation || mutation.type !== 'delete') return;

      await api.delete<void>(`/api/v1/connections/${mutation.key}`);
    },
  }),
);

export const connectionHooks = {
  useAll: () => {
    return useLiveSuspenseQuery(
      (q) => q.from({ connection: connectionCollection }),
      [],
    );
  },

  /**
   * Check if a connection exists and is active
   * @param slug The toolkit slug (integrationId) to check
   * @param _enablePolling Whether to enable polling for connection status (no longer needed with live queries)
   * @returns boolean indicating if connection is active
   */
  useIsConnected: (slug: string | undefined, _enablePolling: boolean = false) => {
    const { data: connections } = useLiveSuspenseQuery(
      (q) => q.from({ connection: connectionCollection }),
      [],
    );

    if (!slug || !connections) return false;

    const connection = connections.find((conn) => conn.slug === slug);
    return connection !== undefined;
  },
};
