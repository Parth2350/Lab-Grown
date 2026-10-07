'use client';
import { AnimatePresence, m } from 'framer-motion';
import { CircleAlert, CircleCheck, X } from 'lucide-react';
import { create } from 'zustand';
import type { ActionResult } from '@/lib/server/admin/types';
import { cn } from '@/lib/utils';

type AdminToast = { id: number; tone: 'success' | 'error'; title: string; description?: string };

type ToastState = {
  toasts: AdminToast[];
  push: (t: Omit<AdminToast, 'id'>) => void;
  dismiss: (id: number) => void;
};

let seq = 1;
export const useAdminToast = create<ToastState>()((set) => ({
  toasts: [],
  push: (t) => {
    const id = seq++;
    set((s) => ({ toasts: [...s.toasts.slice(-3), { ...t, id }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })), t.tone === 'error' ? 6500 : 3800);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));

export const toast = {
  success: (title: string, description?: string) => useAdminToast.getState().push({ tone: 'success', title, description }),
  error: (title: string, description?: string) => useAdminToast.getState().push({ tone: 'error', title, description }),
  /** Toast an ActionResult (success uses `fallback` when the action returned no message). */
  result: (res: ActionResult | null | undefined, fallback = 'Saved') => {
    if (!res) return;
    if (res.ok) toast.success(res.message ?? fallback);
    else toast.error(res.message);
  },
};

export function AdminToaster() {
  const toasts = useAdminToast((s) => s.toasts);
  const dismiss = useAdminToast((s) => s.dismiss);
  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-4 z-[95] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:items-end" aria-live="polite" role="status">
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = t.tone === 'success' ? CircleCheck : CircleAlert;
          return (
            <m.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                'pointer-events-auto flex w-full max-w-sm items-start gap-3 border px-4 py-3 shadow-lift',
                t.tone === 'success' ? 'border-ink bg-ink text-ivory' : 'border-danger bg-white text-danger',
              )}
              role={t.tone === 'error' ? 'alert' : undefined}
            >
              <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', t.tone === 'success' ? 'text-gold-light' : 'text-danger')} strokeWidth={1.5} aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium">{t.title}</p>
                {t.description && <p className={cn('mt-0.5 text-xs', t.tone === 'success' ? 'text-ivory/70' : 'text-charcoal')}>{t.description}</p>}
              </div>
              <button type="button" onClick={() => dismiss(t.id)} aria-label="Dismiss notification" className={t.tone === 'success' ? 'text-ivory/60 hover:text-ivory' : 'text-danger/60 hover:text-danger'}>
                <X className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </m.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
