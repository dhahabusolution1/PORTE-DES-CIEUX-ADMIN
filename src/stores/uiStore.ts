import { create } from 'zustand';

export type ProcessingState = 'idle' | 'processing' | 'success' | 'error';

const FETCH_DEBOUNCE_MS = 320;

interface ProcessingModal {
  isOpen: boolean;
  state: ProcessingState;
  message: string;
  errorMessage?: string;
}

interface FetchLoadingState {
  count: number;
  message: string;
  visible: boolean;
}

interface UIState {
  sidebarOpen: boolean;
  processingModal: ProcessingModal;
  fetchLoading: FetchLoadingState;
  toggleSidebar: () => void;
  beginFetchLoading: (message: string) => () => void;
  openProcessing: (message: string) => void;
  setProcessingSuccess: (message?: string) => void;
  setProcessingError: (errorMessage: string) => void;
  closeProcessing: () => void;
}

let fetchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

function clearFetchDebounce() {
  if (fetchDebounceTimer) {
    clearTimeout(fetchDebounceTimer);
    fetchDebounceTimer = null;
  }
}

export const useUIStore = create<UIState>((set, get) => ({
  sidebarOpen: true,
  processingModal: {
    isOpen: false,
    state: 'idle',
    message: '',
    errorMessage: undefined,
  },
  fetchLoading: {
    count: 0,
    message: 'Chargement des données…',
    visible: false,
  },
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  beginFetchLoading: (message) => {
    const prev = get().fetchLoading;
    const count = prev.count + 1;

    set({
      fetchLoading: {
        count,
        message,
        visible: prev.visible || count > 1,
      },
    });

    if (count === 1) {
      clearFetchDebounce();
      fetchDebounceTimer = setTimeout(() => {
        set((s) => ({
          fetchLoading: { ...s.fetchLoading, visible: s.fetchLoading.count > 0 },
        }));
      }, FETCH_DEBOUNCE_MS);
    }

    let ended = false;
    return () => {
      if (ended) return;
      ended = true;

      const current = get().fetchLoading;
      const nextCount = Math.max(0, current.count - 1);

      if (nextCount === 0) {
        clearFetchDebounce();
        set({
          fetchLoading: {
            count: 0,
            message: 'Chargement des données…',
            visible: false,
          },
        });
        return;
      }

      set({
        fetchLoading: {
          ...current,
          count: nextCount,
        },
      });
    };
  },

  openProcessing: (message) =>
    set({
      processingModal: { isOpen: true, state: 'processing', message, errorMessage: undefined },
    }),
  setProcessingSuccess: (message) =>
    set((s) => ({
      processingModal: {
        ...s.processingModal,
        state: 'success',
        message: message ?? s.processingModal.message,
      },
    })),
  setProcessingError: (errorMessage) =>
    set((s) => ({
      processingModal: { ...s.processingModal, state: 'error', errorMessage },
    })),
  closeProcessing: () =>
    set({
      processingModal: { isOpen: false, state: 'idle', message: '', errorMessage: undefined },
    }),
}));
