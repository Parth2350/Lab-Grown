'use client';
import Link from 'next/link';
import { AnimatePresence, m } from 'framer-motion';
import { X } from 'lucide-react';
import { useUI } from '@/store/ui';

export function Toaster() {
  const toasts = useUI((s) => s.toasts);
  const dismiss = useUI((s) => s.dismiss);
  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-4 z-[90] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:items-end" aria-live="polite" role="status">
      <AnimatePresence>
        {toasts.map((t) => (
          <m.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-auto flex w-full max-w-sm items-start gap-4 bg-ink px-5 py-4 text-ivory shadow-lift"
          >
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium">{t.title}</p>
              {t.description && <p className="mt-0.5 truncate text-[12px] text-ivory/60">{t.description}</p>}
            </div>
            {t.href && (
              <Link href={t.href} onClick={() => dismiss(t.id)} className="label-caps shrink-0 border-b border-gold-light pb-0.5 text-gold-light">
                {t.action ?? 'View'}
              </Link>
            )}
            <button onClick={() => dismiss(t.id)} aria-label="Dismiss" className="text-ivory/50 hover:text-ivory">
              <X className="h-4 w-4" strokeWidth={1.25} />
            </button>
          </m.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
