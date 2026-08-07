import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';

function IndeterminateBar() {
  return (
    <div className="w-full h-1 bg-accent-100 rounded-full overflow-hidden mt-2">
      <div className="h-full w-1/3 bg-primary-500 rounded-full animate-[processing-bar_1.2s_ease-in-out_infinite]" />
    </div>
  );
}

export function ProcessingModal() {
  const processingModal = useUIStore((s) => s.processingModal);
  const fetchLoading = useUIStore((s) => s.fetchLoading);

  const actionOpen = processingModal.isOpen;
  const fetchOpen = fetchLoading.visible && !actionOpen;

  if (!actionOpen && !fetchOpen) return null;

  const state = actionOpen ? processingModal.state : 'processing';
  const message = actionOpen ? processingModal.message : fetchLoading.message;
  const errorMessage = processingModal.errorMessage;

  return (
    <>
      <style>{`
        @keyframes processing-bar {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(320%); }
        }
        @keyframes processing-pop {
          from { opacity: 0; transform: scale(0.94) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>

      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-accent-900/70 backdrop-blur-[3px]"
        role="dialog"
        aria-modal="true"
        aria-live="polite"
        aria-busy={state === 'processing'}
      >
        <div
          className="bg-surface rounded-xl shadow-2xl border border-accent-200/80 px-8 py-7 flex flex-col items-center gap-3 min-w-[300px] max-w-sm mx-4 animate-[processing-pop_0.22s_ease-out]"
        >
          {state === 'processing' && (
            <>
              <div className="relative flex items-center justify-center w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-primary-100" />
                <div className="absolute inset-0 rounded-full border-4 border-primary-500 border-t-transparent animate-spin" />
                <Loader2 className="w-7 h-7 text-primary-600 animate-spin" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-bold text-accent-900">{message}</p>
                <p className="text-xs text-accent-400">Veuillez patienter…</p>
              </div>
              <IndeterminateBar />
            </>
          )}

          {state === 'success' && (
            <>
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 className="w-9 h-9 text-emerald-600" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-bold text-emerald-800">{message}</p>
                <p className="text-xs text-accent-400">Opération terminée</p>
              </div>
            </>
          )}

          {state === 'error' && (
            <>
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
                <XCircle className="w-9 h-9 text-red-600" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-bold text-red-700">
                  {errorMessage ?? 'Une erreur est survenue'}
                </p>
                <p className="text-xs text-accent-400">Réessayez ou contactez le support</p>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
