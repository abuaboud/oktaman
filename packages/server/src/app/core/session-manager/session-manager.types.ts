import { SessionSource } from '@oktaman/shared';

export interface ChatProcessingJob {
  sessionId: string;
  sessionSource: SessionSource;
  onMessage?: (message: string) => void;
  agentId?: string;
}
