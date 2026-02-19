import { useEffect } from 'react';
import { sessionCollection } from './session-hooks';
import { agentCollection } from './agent-hooks';
import { connectionCollection } from './connection-hooks';

/**
 * Preload essential data for the application
 * This hook eagerly fetches data that users are likely to need,
 * improving perceived performance by loading data before it's requested
 */
export const useDataPreload = () => {
  useEffect(() => {
    // Preload collections in parallel
    Promise.all([
      sessionCollection.preload(),
      agentCollection.preload(),
      connectionCollection.preload(),
    ]).catch((error) => {
      // Silently fail - the data will be fetched when actually needed
      console.debug('Data preload failed (non-critical):', error);
    });
  }, []);
};
