import { queryCollectionOptions } from '@tanstack/query-db-collection';
import {
  createCollection,
  eq,
  useLiveSuspenseQuery,
} from '@tanstack/react-db';
import { Agent, CreateAgentRequest, UpdateAgentRequest } from '@oktaman/shared';
import { api } from '../api';
import { QueryClient, useMutation } from '@tanstack/react-query';

const collectionQueryClient = new QueryClient();

export const agentCollection = createCollection<Agent, string>(
  queryCollectionOptions({
    queryKey: ['agents'],
    queryClient: collectionQueryClient,
    getKey: (agent) => agent.id,
    queryFn: async () => {
      try {
        const response = await api.get<Agent[]>('/v1/agents');
        if (!Array.isArray(response)) {
          console.error('Expected array from /v1/agents, got:', typeof response, response);
          return [];
        }
        return response;
      } catch (error) {
        console.error('Error fetching agents:', error);
        return [];
      }
    },
    onInsert: async ({ transaction, collection }) => {
      await Promise.all(
        transaction.mutations.map(async (mutation) => {
          if (mutation.type !== 'insert') return;

          const modified = mutation.modified as any;
          const data: CreateAgentRequest = {
            webhookId: modified.webhookId,
            displayName: modified.name,
            description: modified.description,
            instructions: modified.instructions,
            trigger: modified.trigger,
          };

          const response = await api.post<any>('/v1/agents', data);

          collection.update(mutation.key, (draft: any) => {
            draft.id = response.id;
          });
        })
      );
    },

    onUpdate: async ({ transaction }) => {
      await Promise.all(
        transaction.mutations.map(async (mutation) => {
          if (mutation.type !== 'update') return;

          const { key, modified } = mutation;
          const updateData: UpdateAgentRequest = {
            name: modified.name,
            description: modified.description,
            instructions: modified.instructions,
            status: modified.status,
            modelId: modified.modelId,
          };

          await api.patch<Agent>(`/v1/agents/${key}`, updateData);
        })
      );
    },

    onDelete: async ({ transaction }) => {
      const results = await Promise.allSettled(
        transaction.mutations.map(async (mutation) => {
          if (mutation.type !== 'delete') return;
          await api.delete<void>(`/v1/agents/${mutation.key}`);
        })
      );

      const failures = results.filter((r) => r.status === 'rejected');
      if (failures.length > 0) {
        console.error('Failed to delete some agents:', failures);
        throw new Error(`Failed to delete ${failures.length} agent(s)`);
      }
    },

  }),
);


export const agentsHooks = {
  useAll: () => {
    return useLiveSuspenseQuery(
      (q) =>
        q.from({ agent: agentCollection }),
      [],
    );
  },
  useById: (agentId: string) => {
    const result = useLiveSuspenseQuery(
      (q) =>
        q
          .from({ agent: agentCollection })
          .where(({ agent }) => eq(agent.id, agentId)),
      [agentId],
    );

    return {
      data: result.data?.[0] || null,
      isLoading: false,
    };
  },
};

export const useTestAgent = () => {
  return useMutation({
    mutationFn: async (params: { agentId: string; sessionId?: string }): Promise<{ sessionId: string }> => {
      const response = await api.post<{ sessionId: string }>(
        `/v1/agents/${params.agentId}/test`,
        { sessionId: params.sessionId }
      );
      return response;
    },
  });
};