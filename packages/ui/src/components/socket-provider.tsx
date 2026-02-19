import React, { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  AgentStreamingEvent,
  AgentStreamingUpdate,
  CollectionUpdate,
  conversationUtils,
  Conversation,
  Agent,
  SessionMetadata,
} from '@oktaman/shared';

import { API_BASE_URL } from '@/lib/api';
import { sessionHooks, sessionCollection } from '@/lib/hooks/session-hooks';
import { agentCollection } from '@/lib/hooks/agent-hooks';

const socket = io(API_BASE_URL, {
  transports: ['websocket'],
  path: '/socket.io',
  autoConnect: false,
  reconnection: true,
  withCredentials: true,
});

const SocketContext = React.createContext<typeof socket>(socket);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const queryClient = useQueryClient();
  const toastIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Connect socket immediately (no authentication required)
    if (!socket.connected) {
      console.log("connecting socket");
      socket.connect();

      socket.on('connect', () => {
        if (toastIdRef.current) {
          toast.dismiss(toastIdRef.current);
          toastIdRef.current = null;
        }
        console.log('connected to socket');
      });

      socket.on('disconnect', (reason) => {
        if (!toastIdRef.current) {
          const id = toast('Connection Lost', {
            id: 'websocket-disconnected',
            description: 'We are trying to reconnect...',
            duration: Infinity,
          });
          toastIdRef.current = id?.toString() ?? null;
        }
        if (reason === 'io server disconnect') {
          socket.connect();
        }
      });
    }

    function handleAgentUpdate(
      operation: 'insert' | 'update' | 'delete',
      entity: Agent | undefined,
    ) {
      switch (operation) {
        case 'insert': {
          if (entity) agentCollection.utils.writeInsert(entity);
          break;
        }
        case 'update':
          if (entity) agentCollection.utils.writeUpdate(entity);
          break;
        case 'delete':
          agentCollection.utils.writeDelete(entity);
          break;
      }
    }

    function handleSessionUpdate(
      operation: 'insert' | 'update' | 'delete',
      entity: SessionMetadata | undefined,
    ) {
      switch (operation) {
        case 'insert':
        case 'update':
          // Only upsert if entity exists and has a valid ID
          if (entity && entity.id && entity.id !== 'undefined') {
            sessionCollection.utils.writeUpsert(entity);
          } else {
            console.warn('[SocketProvider] Received session update with invalid entity:', entity);
          }
          break;
        case 'delete':
          if (entity?.id && entity.id !== 'undefined') {
            sessionCollection.utils.writeDelete(entity.id);
          }
          break;
      }
    }

    // Handle all socket events with a single listener
    socket.onAny((eventName, ...args) => {
      switch (eventName) {
        case AgentStreamingEvent.AGENT_STREAMING_UPDATE: {
          const update = args[0] as AgentStreamingUpdate;
          if (update.event === AgentStreamingEvent.AGENT_STREAMING_UPDATE) {
            const sessionId = update.data.sessionId;
            if (sessionId) {
              const conversationData = queryClient.getQueryData<Conversation>(['conversation', sessionId]);
              if (conversationData) {
                const updatedConversation = conversationUtils.streamChunk(conversationData, update.data);
                sessionHooks.updateConversation(queryClient, sessionId, updatedConversation);
              } else {
                queryClient.invalidateQueries({ queryKey: ['conversation', sessionId] });
              }
            }
          }
          break;
        }

        case AgentStreamingEvent.AGENT_COMPACTION: {
          const update = args[0] as AgentStreamingUpdate;
          if (update.event === AgentStreamingEvent.AGENT_COMPACTION) {
            const sessionId = update.data.sessionId;
            if (sessionId) {
              const conversationData = queryClient.getQueryData<Conversation>(['conversation', sessionId]);
              if (conversationData) {
                const updatedConversation = conversationUtils.addCompactionMessage(
                  conversationData,
                  update.data.compaction
                );
                sessionHooks.updateConversation(queryClient, sessionId, updatedConversation);
              } else {
                // Conversation not in cache yet - invalidate to trigger refetch when component mounts
                queryClient.invalidateQueries({ queryKey: ['conversation', sessionId] });
              }
            }
          }
          break;
        }

        case AgentStreamingEvent.AGENT_SESSION_UPDATE: {
          const update = args[0] as AgentStreamingUpdate;
          if (update.event === AgentStreamingEvent.AGENT_SESSION_UPDATE) {
            const sessionId = update.data.sessionId;
            if (sessionId) {
              sessionCollection.utils.writeUpdate({
                id: sessionId,
                status: update.data.status,
                ...(update.data.isStreaming !== undefined && { isStreaming: update.data.isStreaming }),
                ...(update.data.usage !== undefined && { usage: update.data.usage }),
                ...(update.data.title !== undefined && { title: update.data.title }),
                ...(update.data.cost !== undefined && { cost: update.data.cost }),
              });

              if (update.data.status === 'closed' && update.data.isStreaming === false) {
                queryClient.invalidateQueries({ queryKey: ['conversation', sessionId], exact: true });
              }
            }
          }
          break;
        }

        case AgentStreamingEvent.COLLECTION_UPDATE: {

          const update = args[0] as CollectionUpdate;

          if (update.event === AgentStreamingEvent.COLLECTION_UPDATE) {
            const { collection, operation, entity } = update.data;

            if (collection === 'agents') {
              handleAgentUpdate(operation, entity as Agent | undefined);
            } else if (collection === 'sessions') {
              handleSessionUpdate(operation, entity as SessionMetadata | undefined);
            }
          }
          break;
        }
      }
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.offAny();
      socket.disconnect();
    };
  });

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => React.useContext(SocketContext);