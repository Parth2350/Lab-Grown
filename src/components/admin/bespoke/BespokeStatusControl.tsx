'use client';
import { useEffect, useId, useState, useTransition } from 'react';
import { ArrowRight, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { setBespokeStatus } from '@/lib/server/admin/actions/bespoke';
import { cn } from '@/lib/utils';
import { ActionButton, ConfirmDialog } from '../forms';
import { toast } from '../toast';
import { selectChevron, selectSm } from '../ui';
import { BESPOKE_PIPELINE, BESPOKE_STATUSES, BESPOKE_STATUS_HINT, BESPOKE_STATUS_LABEL, nextBespokeStatus, type BespokeStatus } from './status';

const CLOSE_CONFIRM = {
  title: 'Close this request?',
  description: 'It will be marked as closed / declined and leave the active pipeline. You can reopen it later by choosing another status.',
  confirmLabel: 'Close request',
};

/** Pipeline stepper (NEW → … → COMPLETED, plus terminal CLOSED) with advance + set-any-status controls. */
export function BespokeStatusControl({ id, status }: { id: string; status: BespokeStatus }) {
  const selectId = useId();
  const [value, setValue] = useState<BespokeStatus>(status);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, start] = useTransition();
  useEffect(() => setValue(status), [status]);

  const closed = status === 'CLOSED';
  const currentIndex = (BESPOKE_PIPELINE as readonly string[]).indexOf(status);
  const next = nextBespokeStatus(status);

  const apply = (target: BespokeStatus) =>
    start(async () => {
      const res = await setBespokeStatus(id, target).catch(() => ({ ok: false as const, message: 'Something went wrong. Please try again.' }));
      toast.result(res);
      setConfirmOpen(false);
      if (!res.ok) setValue(status);
    });

  return (
    <div>
      <ol className="space-y-0" aria-label="Request progress">
        {BESPOKE_PIPELINE.map((step, i) => {
          const done = !closed && i < currentIndex;
          const current = !closed && i === currentIndex;
          const last = i === BESPOKE_PIPELINE.length - 1;
          return (
            <li key={step} className="relative flex gap-3 pb-4 last:pb-0" aria-current={current ? 'step' : undefined}>
              {!last && <span className={cn('absolute left-[11px] top-6 h-[calc(100%-1.5rem)] w-px', done ? 'bg-ink' : 'bg-line')} aria-hidden />}
              <span
                className={cn(
                  'relative z-[1] flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10.5px] tabular-nums',
                  done && 'border-ink bg-ink text-ivory',
                  current && 'border-gold bg-gold-pale text-gold-deep ring-4 ring-gold-pale/60',
                  !done && !current && 'border-line bg-white text-taupe',
                )}
                aria-hidden
              >
                {done ? <Check className="h-3 w-3" strokeWidth={2} /> : i + 1}
              </span>
              <div className="min-w-0 pt-0.5">
                <p className={cn('text-[13px] leading-5', current ? 'font-medium text-ink' : done ? 'text-charcoal' : 'text-taupe')}>
                  {BESPOKE_STATUS_LABEL[step]}
                  <span className="sr-only">{done ? ' — done' : current ? ' — current stage' : ' — upcoming'}</span>
                </p>
                {current && <p className="mt-0.5 text-xs text-taupe">{BESPOKE_STATUS_HINT[step]}</p>}
              </div>
            </li>
          );
        })}
      </ol>

      <div className={cn('mt-4 flex gap-3 border-t border-dashed border-line pt-4', closed && 'border-solid')} aria-current={closed ? 'step' : undefined}>
        <span
          className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full border', closed ? 'border-ink bg-charcoal text-ivory' : 'border-line bg-white text-taupe')}
          aria-hidden
        >
          <X className="h-3 w-3" strokeWidth={2} />
        </span>
        <div className="min-w-0 pt-0.5">
          <p className={cn('text-[13px] leading-5', closed ? 'font-medium text-ink' : 'text-taupe')}>
            {BESPOKE_STATUS_LABEL.CLOSED}
            {closed && <span className="sr-only"> — current stage</span>}
          </p>
          {closed && <p className="mt-0.5 text-xs text-taupe">{BESPOKE_STATUS_HINT.CLOSED}</p>}
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {next && (
          <ActionButton
            action={() => setBespokeStatus(id, next)}
            variant="primary"
            className="w-full"
            disabled={pending}
            icon={<ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />}
          >
            Move to {BESPOKE_STATUS_LABEL[next].toLowerCase()}
          </ActionButton>
        )}
        {closed && (
          <ActionButton action={() => setBespokeStatus(id, 'IN_REVIEW')} variant="outline" className="w-full" disabled={pending}>
            Reopen for review
          </ActionButton>
        )}

        <div>
          <label htmlFor={selectId} className="mb-1 block text-[10.5px] font-medium uppercase tracking-[0.14em] text-taupe">
            Set status
          </label>
          <div className="flex gap-2">
            <select
              id={selectId}
              value={value}
              onChange={(e) => setValue(e.target.value as BespokeStatus)}
              disabled={pending}
              className={cn(selectSm, 'min-w-0 flex-1')}
              style={selectChevron}
            >
              {BESPOKE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {BESPOKE_STATUS_LABEL[s]}
                </option>
              ))}
            </select>
            <Button
              type="button"
              size="sm"
              variant="outline"
              loading={pending && !confirmOpen}
              disabled={value === status || pending}
              onClick={() => (value === 'CLOSED' ? setConfirmOpen(true) : apply(value))}
            >
              Update
            </Button>
          </div>
        </div>

        {!closed && status !== 'COMPLETED' && (
          <ActionButton
            action={() => setBespokeStatus(id, 'CLOSED')}
            variant="text"
            className="text-taupe"
            disabled={pending}
            icon={<X className="h-3 w-3" strokeWidth={1.75} aria-hidden />}
            confirm={CLOSE_CONFIRM}
          >
            Close or decline request
          </ActionButton>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => {
          if (pending) return;
          setConfirmOpen(false);
          setValue(status);
        }}
        onConfirm={() => apply('CLOSED')}
        pending={pending}
        title={CLOSE_CONFIRM.title}
        description={CLOSE_CONFIRM.description}
        confirmLabel={CLOSE_CONFIRM.confirmLabel}
      />
    </div>
  );
}
