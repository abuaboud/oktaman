import { logger } from '../../common/logger';
import { ChatProcessingJob } from './session-manager.types';
import { sessionService } from '../../brain/session/session.service';
import { oktamanService } from '../../brain/oktaman.service';

const activeSessionControllers = new Map<string, AbortController>();

export const sessionManager = {
  async initialize(): Promise<void> {
    logger.info('Session manager initialized');
  },

  async shutdown(): Promise<void> {
    logger.info('Session manager shutdown');

    for (const [sessionId, controller] of activeSessionControllers.entries()) {
      controller.abort();
      activeSessionControllers.delete(sessionId);
    }
  },

  async enqueueChatProcessing(data: ChatProcessingJob): Promise<void> {
    const { sessionId, onMessage } = data;

    logger.info({ sessionId }, 'Processing chat job');

    const abortController = new AbortController();
    activeSessionControllers.set(sessionId, abortController);

    try {
      const session = await sessionService.getOneOrThrow({ id: sessionId });
      await oktamanService.chatWithOktaMan(session, abortController.signal, onMessage);
      logger.info({ sessionId }, 'Chat processed successfully');
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        logger.info({ sessionId }, 'Chat processing was stopped by user');
      } else {
        logger.error({ sessionId, error }, 'Failed to process chat job');
        throw error;
      }
    } finally {
      activeSessionControllers.delete(sessionId);
    }
  },

  async stopSession(sessionId: string): Promise<boolean> {
    const controller = activeSessionControllers.get(sessionId);
    if (controller) {
      logger.info({ sessionId }, 'Stopping session');
      controller.abort();
      activeSessionControllers.delete(sessionId);
      return true;
    }
    logger.warn({ sessionId }, 'No active session found to stop');
    return false;
  },
};
