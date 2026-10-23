import { createContext, use, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { Toast, type ToastVariant } from '@/components/toast';
import { TOAST_DURATION_MS } from '@/constants/limits';

/**
 * Toast messages must be fixed app strings. Never pass payload text here, so
 * hostile content can't be echoed into a notification.
 */
export type ToastMessage =
  | 'Broadcast sent'
  | 'Broadcast failed'
  | 'Message received'
  | 'Copied'
  | "Couldn't copy"
  | "Couldn't reach the mock server"
  | 'Stopped listening'
  | "Couldn't open link";

type ToastState = { id: number; message: ToastMessage; variant: ToastVariant };

type ToastContextValue = {
  showToast: (message: ToastMessage, variant?: ToastVariant) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const showToast = useCallback((message: ToastMessage, variant: ToastVariant = 'info') => {
    clearTimeout(timer.current);
    setToast({ id: Date.now(), message, variant });
    timer.current = setTimeout(() => setToast(null), TOAST_DURATION_MS);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext value={value}>
      {children}
      {toast && <Toast key={toast.id} message={toast.message} variant={toast.variant} />}
    </ToastContext>
  );
}

export function useToast(): ToastContextValue {
  const context = use(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider');
  return context;
}
