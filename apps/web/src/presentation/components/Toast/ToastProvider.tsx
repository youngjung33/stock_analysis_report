'use client';

import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { cn } from '../../lib/cn';

export type ToastVariant = 'error' | 'success' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void;
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
  showInfo: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const AUTO_DISMISS_MS = 5000;

const VARIANT_STYLE: Record<ToastVariant, string> = {
  error: 'border-danger/40 bg-danger/15 text-danger',
  success: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300',
  info: 'border-border bg-card/95 text-foreground',
};

const VARIANT_ICON: Record<ToastVariant, typeof AlertCircle> = {
  error: AlertCircle,
  success: CheckCircle2,
  info: Info,
};

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}) {
  const { t } = useTranslation();
  const Icon = VARIANT_ICON[toast.variant];

  return (
    <div
      role={toast.variant === 'error' ? 'alert' : 'status'}
      className={cn(
        'pointer-events-auto flex w-full items-start gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-md transition-all',
        VARIANT_STYLE[toast.variant],
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <p className="min-w-0 flex-1 text-sm leading-snug">{toast.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 rounded-md p-0.5 opacity-70 transition hover:opacity-100"
        aria-label={t('common.close')}
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = 'info') => {
      const trimmed = message.trim();
      if (!trimmed) return;

      const id = crypto.randomUUID();
      setToasts((prev) => [...prev.slice(-4), { id, message: trimmed, variant }]);

      const timer = setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
      timersRef.current.set(id, timer);
    },
    [dismiss],
  );

  const value = useMemo(
    () => ({
      showToast,
      showError: (message: string) => showToast(message, 'error'),
      showSuccess: (message: string) => showToast(message, 'success'),
      showInfo: (message: string) => showToast(message, 'info'),
    }),
    [showToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* 데스크톱: 우측 상단 / 모바일: 하단 snackbar */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className={cn(
          'pointer-events-none fixed z-[100] flex flex-col gap-2 p-4',
          'inset-x-0 bottom-0 md:inset-x-auto md:bottom-auto md:right-0 md:top-0 md:max-w-sm',
        )}
      >
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
