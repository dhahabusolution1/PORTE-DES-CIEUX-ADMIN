import toast from 'react-hot-toast';
import { useUIStore } from '@/stores/uiStore';

export function useProcessing() {
  const { openProcessing, setProcessingSuccess, setProcessingError, closeProcessing } =
    useUIStore();

  async function run<T>(
    messageOrFn: string | (() => Promise<T>),
    fnOrOptions?: (() => Promise<T>) | { successMessage?: string; errorMessage?: string },
    options?: { successMessage?: string; errorMessage?: string }
  ): Promise<T | undefined> {
    const message = typeof messageOrFn === 'string' ? messageOrFn : 'Traitement en cours...';
    const fn = typeof messageOrFn === 'function' ? messageOrFn : (fnOrOptions as () => Promise<T>);
    const opt = typeof messageOrFn === 'string' ? options : (fnOrOptions as { successMessage?: string; errorMessage?: string });

    openProcessing(message);
    try {
      const result = await fn();
      setProcessingSuccess(opt?.successMessage ?? 'Opération réussie');
      toast.success(opt?.successMessage ?? 'Opération réussie');
      await new Promise((r) => setTimeout(r, 800));
      closeProcessing();
      return result;
    } catch (err) {
      const msg =
        opt?.errorMessage ??
        (err instanceof Error ? err.message : 'Une erreur est survenue');
      setProcessingError(msg);
      toast.error(msg);
      await new Promise((r) => setTimeout(r, 1500));
      closeProcessing();
      return undefined;
    }
  }

  return { run };
}
