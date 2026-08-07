import { useEffect } from 'react';
import { useUIStore } from '@/stores/uiStore';

/**
 * Affiche le ProcessingModal pour un chargement local (hors Apollo).
 */
export function useFetchLoading(active: boolean, message = 'Chargement des données…') {
  const beginFetchLoading = useUIStore((s) => s.beginFetchLoading);

  useEffect(() => {
    if (!active) return;
    const end = beginFetchLoading(message);
    return end;
  }, [active, message, beginFetchLoading]);
}
