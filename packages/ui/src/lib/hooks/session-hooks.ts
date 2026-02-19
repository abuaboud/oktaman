import { queryCollectionOptions } from '@tanstack/query-db-collection';
import {
  createCollection,
  eq,
  useLiveQuery,
  useLiveSuspenseQuery,
} from '@tanstack/react-db';
import { SessionMetadata, Session, Conversation, isNil } from '@oktaman/shared';
import { api } from '../api';
import { QueryClient, useQuery } from '@tanstack/react-query';

const collectionQueryClient = new QueryClient();
const CONVERSATION_QUERY_KEY = ['conversation'];

export const sessionCollection = createCollection<SessionMetadata, string>(
  queryCollectionOptions({
    queryKey: ['sessions'],
    queryClient: collectionQueryClient,
    getKey: (session) => session.id,
    queryFn: async () => {
      const response = await api.get<SessionMetadata[]>('/v1/sessions');
      return response;
    },
    onDelete: async ({ transaction }) => {
      const results = await Promise.allSettled(
        transaction.mutations.map(async (mutation) => {
          if (mutation.type !== 'delete') return;
          await api.delete<void>(`/v1/sessions/${mutation.key}`);
        })
      );

      const failures = results.filter((r) => r.status === 'rejected');
      if (failures.length > 0) {
        console.error('Failed to delete some sessions:', failures);
        throw new Error(`Failed to delete ${failures.length} session(s)`);
      }
    },
    onUpdate: async ({ transaction }) => {
      await Promise.all(
        transaction.mutations.map(async (mutation) => {
          if (mutation.type !== 'update') return;
          await api.patch<SessionMetadata>(`/v1/sessions/${mutation.key}`, {
            status: mutation.changes.status,
          });
        })
      );
    },
  }),
);

export const sessionHooks = {
  useAll: () => {
    return useLiveSuspenseQuery(
      (q) =>
        q
          .from({ session: sessionCollection })
          .orderBy(({ session }) => session.created, 'desc'),
      [],
    );
  },
  useSession: (id: string | null) => {
    return useLiveQuery(
      (q) =>
        q
          .from({ session: sessionCollection })
          .where(({ session }) => eq(session.id, id))
          .findOne(),
      [id],
    );
  },
  useConversation: (id: string | null) => {
    return useQuery<Conversation | null>({
      queryKey: [...CONVERSATION_QUERY_KEY, id],
      queryFn: async () => {
        if (isNil(id) || id === '') {
          return [];
        }
        const session = await api.get<Session>(`/v1/sessions/${id}`);
        return session.conversation;
      },
      staleTime: 5 * 60 * 1000,
    });
  },
  clearNewChat: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: [...CONVERSATION_QUERY_KEY, null] });
  },
  updateConversation: (queryClient: QueryClient, id: string | null, conversation: Conversation) => {
    queryClient.setQueryData<Conversation>([...CONVERSATION_QUERY_KEY, id], conversation);
  }
};

