import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Session,
  conversationUtils,
  SessionMetadata,
  Conversation,
  ChatWithOktaManRequest,
  isNil,
} from '@oktaman/shared';
import { api } from '../api';
import { sessionCollection, sessionHooks } from './session-hooks';
import { useNavigate } from 'react-router-dom';

type UseChatOptions = {
  sessionId: string | null;
  onSessionCreated?: (session: Session) => void;
};

export const useChat = (options: UseChatOptions) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: conversationData } = sessionHooks.useConversation(options.sessionId);
  let clonedConversationData: Conversation = conversationData ? JSON.parse(JSON.stringify(conversationData)) : [];

  const stopMutation = useMutation({
    mutationFn: async (stop: UseStopAgentOptions) => {
      if (!stop.sessionId) {
        throw new Error('No session to stop');
      }
      await api.post(`/v1/sessions/${stop.sessionId}/stop`, {});
    },
  });

  const mutation = useMutation({
    mutationFn: async (params: ChatWithOktaManRequest) => {
      const { message, files = [], toolOutput } = params;
      const { sessionId } = options;
      let currentSessionId = sessionId;


      if (!currentSessionId) {
        const newSession = await api.post<SessionMetadata>('/v1/sessions/', {
          userMessage: message,
          modelId: params.modelId,
        });

        // Validate session ID
        if (!newSession.id || newSession.id === 'undefined') {
          throw new Error('Server returned invalid session ID');
        }

        currentSessionId = newSession.id;
        sessionHooks.updateConversation(queryClient, currentSessionId, clonedConversationData);
        sessionCollection.utils.writeUpsert(newSession);
        sessionHooks.clearNewChat(queryClient);
      }

      if (!isNil(toolOutput)) {
        clonedConversationData = conversationUtils.updateToolOutput(
          clonedConversationData,
          toolOutput
        );
      } else {
        clonedConversationData = conversationUtils.addUserMessage({
          conversation: clonedConversationData,
          message,
          files,
        });
        clonedConversationData = conversationUtils.addEmptyAssistantMessage(clonedConversationData);
      }
      sessionHooks.updateConversation(queryClient, currentSessionId, clonedConversationData);

      sessionCollection.utils.writeUpdate({
        id: currentSessionId,
        isStreaming: true,
        status: 'running' as const,
      });

      if (!sessionId) {
        navigate(`/sessions/${currentSessionId}`, { replace: true });
      }
      // Send the chat message (streaming updates will come via websocket)
      await api.post(
        `/v1/sessions/${currentSessionId}/chat`,
        params
      );
    },
  });

  return {
    send: mutation.mutate,
    stop: stopMutation.mutate,
    isStopping: stopMutation.isPending,
    isPending: mutation.isPending || stopMutation.isPending,
    error: mutation.error || stopMutation.error,
  };
};

type UseStopAgentOptions = {
  sessionId: string | null;
};

