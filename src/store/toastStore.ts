import { create } from 'zustand';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

interface ToastStore {
  visible: boolean;
  message: string;
  subtitle?: string;
  type: ToastType;
  _timerId: ReturnType<typeof setTimeout> | null;
  showToast: (message: string, options?: { subtitle?: string; type?: ToastType; duration?: number }) => void;
  hideToast: () => void;
}

export const useToastStore = create<ToastStore>((set, get) => ({
  visible: false,
  message: '',
  subtitle: undefined,
  type: 'info',
  _timerId: null,

  showToast: (message, options = {}) => {
    const { subtitle, type = 'info', duration = 3200 } = options;

    // Clear any existing auto-dismiss timer
    const prev = get()._timerId;
    if (prev) clearTimeout(prev);

    const timerId = setTimeout(() => get().hideToast(), duration);

    set({ visible: true, message, subtitle, type, _timerId: timerId });
  },

  hideToast: () => {
    const prev = get()._timerId;
    if (prev) clearTimeout(prev);
    set({ visible: false, _timerId: null });
  },
}));

/** Call from outside React (utility functions, store actions) */
export const showToast = (
  message: string,
  options?: { subtitle?: string; type?: ToastType; duration?: number },
) => useToastStore.getState().showToast(message, options);
