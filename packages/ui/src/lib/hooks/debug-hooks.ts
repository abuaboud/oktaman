import { useMemo } from 'react';

export function useDebugMode(): boolean {
  return useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('debug') === 'true';
  }, []);
}
