'use client';
import { useActionState, useEffect, useRef, useState, useTransition, type FormEvent, type ReactNode } from 'react';
import { useFormStatus } from 'react-dom';
import { unstable_rethrow, useRouter } from 'next/navigation';
import { CircleAlert, CircleCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import type { ActionResult, BoundAction, FormAction, FormState } from '@/lib/server/admin/types';
import { cn } from '@/lib/utils';
import { toast } from './toast';

type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'gold' | 'link';

/**
 * useActionState + toast feedback, submitted via onSubmit so React does NOT reset the
 * uncontrolled fields when validation fails (the user keeps what they typed).
 *
 *   const form = useAdminForm(saveCoupon, { onSuccess: () => setOpen(false) });
 *   <form onSubmit={form.onSubmit}> … <FieldMsg state={form.state} name="code" />
 *   <SubmitButton pending={form.pending}>Save</SubmitButton>
 */
export function useAdminForm<T = unknown>(action: FormAction<T>, opts: { onSuccess?: (res: ActionResult<T>) => void; successMessage?: string; silent?: boolean } = {}) {
  // A request that never reaches the server (connection drop, request rejected by the host)
  // becomes an error message instead of crashing the page into the error screen.
  const [state, dispatch, pending] = useActionState<FormState<T>, FormData>(async (prev, fd) => {
    try {
      return await action(prev, fd);
    } catch (e) {
      unstable_rethrow(e);
      return { ok: false, message: 'We couldn’t reach the server. Please check your connection and try again.' };
    }
  }, null);
  const [, startTransition] = useTransition();
  const optsRef = useRef(opts);
  optsRef.current = opts;
  useEffect(() => {
    if (!state) return;
    // Field-level validation errors are shown inline (FieldMsg/FormBanner) — no toast needed.
    const inlineOnly = !state.ok && !!state.fieldErrors && Object.keys(state.fieldErrors).length > 0;
    if (!optsRef.current.silent && !inlineOnly) toast.result(state, optsRef.current.successMessage);
    if (state.ok) optsRef.current.onSuccess?.(state);
  }, [state]);
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLElement | null;
    const fd = new FormData(e.currentTarget, submitter);
    startTransition(() => dispatch(fd));
  };
  /** Submit arbitrary FormData (e.g. built from client state) */
  const submit = (fd: FormData) => startTransition(() => dispatch(fd));
  return { state, pending, onSubmit, submit };
}

/** Field-level error for `name` from a FormState */
export function FieldMsg({ state, name, className }: { state: FormState | undefined; name: string; className?: string }) {
  const msg = state && !state.ok ? state.fieldErrors?.[name] : undefined;
  if (!msg) return null;
  return (
    <p className={cn('mt-1 text-xs text-danger', className)} role="alert">
      {msg}
    </p>
  );
}

/** Inline banner for the overall form result (complements the toast for screen-reader + persistence). */
export function FormBanner({ state, className }: { state: FormState | undefined; className?: string }) {
  if (!state?.message) return null;
  return (
    <div
      role={state.ok ? 'status' : 'alert'}
      className={cn(
        'flex items-start gap-2 border px-3 py-2 text-[15px]',
        state.ok ? 'border-success/30 bg-success/[0.06] text-success' : 'border-danger/30 bg-danger/[0.05] text-danger',
        className,
      )}
    >
      {state.ok ? <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.5} /> : <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.5} />}
      <span>{state.message}</span>
    </div>
  );
}

/** Submit button with a spinner. Pass `pending` from useAdminForm (or it falls back to useFormStatus for `<form action>`). */
export function SubmitButton({
  children,
  variant = 'primary',
  className,
  pendingLabel,
  disabled,
  name,
  value,
  pending: pendingProp,
}: {
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
  pendingLabel?: string;
  disabled?: boolean;
  name?: string;
  value?: string;
  pending?: boolean;
}) {
  const status = useFormStatus();
  const pending = pendingProp ?? status.pending;
  return (
    <Button type="submit" size="sm" variant={variant} loading={pending} disabled={disabled} className={className} name={name} value={value}>
      {pending && pendingLabel ? pendingLabel : children}
    </Button>
  );
}

/** Accessible confirmation modal (Esc / overlay closes, focus trapped). */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  tone = 'danger',
  pending,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  tone?: 'danger' | 'default';
  pending?: boolean;
}) {
  return (
    <Sheet open={open} onClose={onClose} side="center" label={title} hideClose className="top-[20vh] max-w-md border border-line" bodyClassName="p-6">
      <h2 className="font-serif text-2xl text-ink">{title}</h2>
      {description && <div className="mt-2 text-[15px] leading-relaxed text-charcoal">{description}</div>}
      <div className="mt-6 flex justify-end gap-2">
        <Button type="button" size="sm" variant="ghost" onClick={onClose} data-autofocus>
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          variant="primary"
          loading={pending}
          onClick={onConfirm}
          className={tone === 'danger' ? 'border-danger bg-danger hover:border-danger hover:bg-danger/90' : undefined}
        >
          {confirmLabel}
        </Button>
      </div>
    </Sheet>
  );
}

/**
 * Button that runs a bound server action (optionally behind a confirm dialog) and toasts the result.
 *   <ActionButton action={deleteCoupon.bind(null, id)} confirm={{ title: 'Delete coupon?' }}>Delete</ActionButton>
 */
export function ActionButton({
  action,
  children,
  confirm,
  variant = 'outline',
  className,
  successMessage,
  onDone,
  redirectTo,
  title,
  icon,
  disabled,
  size = 'sm',
}: {
  action: BoundAction;
  children?: ReactNode;
  confirm?: { title: string; description?: ReactNode; confirmLabel?: string; tone?: 'danger' | 'default' };
  variant?: ButtonVariant | 'icon' | 'text';
  className?: string;
  successMessage?: string;
  onDone?: (res: ActionResult) => void;
  /** Navigate here after a successful run (e.g. back to the list after deleting) */
  redirectTo?: string;
  title?: string;
  icon?: ReactNode;
  disabled?: boolean;
  size?: 'sm' | 'xs';
}) {
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const run = () =>
    start(async () => {
      try {
        const res = await action();
        toast.result(res, successMessage);
        setOpen(false);
        onDone?.(res);
        if (res.ok && redirectTo) router.push(redirectTo);
      } catch {
        toast.error('Something went wrong. Please try again.');
      }
    });

  const onClick = () => (confirm ? setOpen(true) : run());

  let button: ReactNode;
  if (variant === 'icon') {
    button = (
      <button
        type="button"
        onClick={onClick}
        disabled={pending || disabled}
        title={title}
        aria-label={title}
        aria-busy={pending}
        className={cn('inline-flex h-8 w-8 items-center justify-center border border-transparent text-taupe transition-colors hover:border-line hover:bg-white hover:text-ink disabled:opacity-40', className)}
      >
        {pending ? <span className="h-3.5 w-3.5 animate-spin rounded-full border border-current border-t-transparent" aria-hidden /> : icon}
      </button>
    );
  } else if (variant === 'text') {
    button = (
      <button
        type="button"
        onClick={onClick}
        disabled={pending || disabled}
        title={title}
        aria-busy={pending}
        className={cn('inline-flex items-center gap-1.5 text-xs text-charcoal underline-offset-4 transition-colors hover:text-ink hover:underline disabled:opacity-40', className)}
      >
        {pending ? <span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" aria-hidden /> : icon}
        {children}
      </button>
    );
  } else {
    button = (
      <Button type="button" size="sm" variant={variant} loading={pending} disabled={disabled} onClick={onClick} title={title} className={cn(size === 'xs' && 'h-7 px-3 text-[12px]', className)}>
        {!pending && icon}
        {children}
      </Button>
    );
  }

  return (
    <>
      {button}
      {confirm && (
        <ConfirmDialog
          open={open}
          onClose={() => !pending && setOpen(false)}
          onConfirm={run}
          pending={pending}
          title={confirm.title}
          description={confirm.description}
          confirmLabel={confirm.confirmLabel}
          tone={confirm.tone}
        />
      )}
    </>
  );
}

/** Switch-style toggle bound to a server action (e.g. product active). Optimistic. */
export function ToggleAction({ checked, action, label, onLabel = 'On', offLabel = 'Off' }: { checked: boolean; action: (next: boolean) => Promise<ActionResult>; label: string; onLabel?: string; offLabel?: string }) {
  const [value, setValue] = useState(checked);
  const [pending, start] = useTransition();
  useEffect(() => setValue(checked), [checked]);
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      aria-label={label}
      title={label}
      disabled={pending}
      onClick={() => {
        const next = !value;
        setValue(next);
        start(async () => {
          const res = await action(next).catch(() => ({ ok: false as const, message: 'Something went wrong' }));
          if (!res.ok) {
            setValue(!next);
            toast.error(res.message);
          } else toast.result(res, `${label}: ${next ? onLabel : offLabel}`);
        });
      }}
      className={cn('group inline-flex items-center gap-2 text-xs disabled:opacity-60', value ? 'text-ink' : 'text-taupe')}
    >
      <span className={cn('relative inline-flex h-[18px] w-8 shrink-0 items-center border transition-colors', value ? 'border-ink bg-ink' : 'border-stone bg-white')}>
        <span className={cn('absolute h-3 w-3 transition-all', value ? 'left-[16px] bg-ivory' : 'left-[2px] bg-stone')} />
      </span>
      <span className="sr-only sm:not-sr-only">{value ? onLabel : offLabel}</span>
    </button>
  );
}

/** <select> that submits its enclosing GET form on change (filters). */
export function AutoSubmitSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} onChange={(e) => (props.onChange?.(e), e.currentTarget.form?.requestSubmit())} />;
}

/** Character counter for SEO inputs */
export function CharCount({ value, ideal, max }: { value: string; ideal: [number, number]; max: number }) {
  const n = value.length;
  const tone = n === 0 ? 'text-taupe' : n > max ? 'text-danger' : n >= ideal[0] && n <= ideal[1] ? 'text-success' : 'text-[#7A5718]';
  return (
    <span className={cn('text-[13px] tabular-nums', tone)} aria-live="polite">
      {n}/{max}
      {n > max ? ' — will be truncated' : n >= ideal[0] && n <= ideal[1] ? ' — good length' : ''}
    </span>
  );
}
