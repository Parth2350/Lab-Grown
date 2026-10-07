'use client';
import { AnimatePresence, m, type TargetAndTransition } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { useMounted } from '@/hooks/use-mounted';

type Side = 'right' | 'left' | 'bottom' | 'top' | 'center';

const panel: Record<Side, { className: string; initial: TargetAndTransition; animate: TargetAndTransition }> = {
  right: { className: 'right-0 top-0 h-full w-full max-w-[460px]', initial: { x: '100%' }, animate: { x: 0 } },
  left: { className: 'left-0 top-0 h-full w-full max-w-[420px]', initial: { x: '-100%' }, animate: { x: 0 } },
  bottom: { className: 'bottom-0 left-0 max-h-[88vh] w-full rounded-t-xl', initial: { y: '100%' }, animate: { y: 0 } },
  top: { className: 'left-0 top-0 w-full', initial: { y: '-100%' }, animate: { y: 0 } },
  center: {
    className: 'inset-x-4 top-[4vh] mx-auto max-h-[92vh] max-w-5xl',
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
  },
};

type Props = {
  open: boolean;
  onClose: () => void;
  side?: Side;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  bodyClassName?: string;
  label?: string;
  hideClose?: boolean;
};

/** Accessible slide-over / modal: portal, overlay, Esc to close, focus trap, scroll lock, focus restore. */
export function Sheet({ open, onClose, side = 'right', title, children, footer, className, bodyClassName, label, hideClose }: Props) {
  const mounted = useMounted();
  const ref = useRef<HTMLDivElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    lastFocus.current = document.activeElement as HTMLElement;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current();
      if (e.key === 'Tab' && ref.current) {
        const f = ref.current.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])');
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    const t = setTimeout(() => ref.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus(), 80);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
      clearTimeout(t);
      lastFocus.current?.focus?.();
    };
  }, [open]);

  if (!mounted) return null;
  const p = panel[side];
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80]">
          <m.div
            className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            aria-hidden
          />
          <m.div
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-label={label ?? (typeof title === 'string' ? title : undefined)}
            className={cn('absolute flex flex-col bg-ivory shadow-lift', p.className, className)}
            initial={p.initial}
            animate={p.animate}
            exit={p.initial}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            {(title || !hideClose) && (
              <div className={cn('flex items-center justify-between gap-4 px-5 py-4 sm:px-7', title ? 'border-b border-line' : 'absolute right-0 top-0 z-10')}>
                {title && <div className="font-serif text-xl">{title}</div>}
                {!hideClose && (
                  <button onClick={onClose} className="-mr-2 rounded-full p-2 text-ink/70 transition-colors hover:bg-porcelain hover:text-ink" aria-label="Close">
                    <X className="h-5 w-5" strokeWidth={1.25} />
                  </button>
                )}
              </div>
            )}
            <div className={cn('min-h-0 flex-1 overflow-y-auto overscroll-contain', bodyClassName)}>{children}</div>
            {footer && <div className="border-t border-line bg-ivory px-5 py-4 sm:px-7">{footer}</div>}
          </m.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
