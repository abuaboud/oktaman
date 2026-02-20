import { AssistantConversationContent, SessionSource } from '@oktaman/shared';

export interface ChatProcessingJob {
  sessionId: string;
  sessionSource: SessionSource;
  onMessage?: (parts: AssistantConversationContent[]) => void;
  agentId?: string;
}
