'use client';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { BadgeCheck, Check, ExternalLink, Trash2, X } from 'lucide-react';
import { Stars } from '@/components/ui/Stars';
import { bulkSetReviewStatus, deleteReview, setReviewStatus } from '@/lib/server/admin/actions/reviews';
import type { ActionResult } from '@/lib/server/admin/types';
import { cn } from '@/lib/utils';
import { formatDate, formatRelative } from '../format';
import { ActionButton } from '../forms';
import { Badge, StatusBadge } from '../ui';

export type ReviewItem = {
  id: string;
  rating: number;
  title: string;
  body: string;
  authorName: string;
  location: string | null;
  isVerified: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  productId: string;
  product: { name: string; slug: string };
};

const MAX_BULK = 100;

/** Long bodies are clamped to three lines; <details> expands them without JS. */
function ReviewBody({ body }: { body: string }) {
  const long = body.length > 240 || body.split('\n').length > 3;
  if (!long) return <p className="mt-1 whitespace-pre-line break-words text-[15px] leading-relaxed text-charcoal">{body}</p>;
  return (
    <details className="group mt-1">
      <summary className="cursor-pointer list-none text-[15px] leading-relaxed text-charcoal [&::-webkit-details-marker]:hidden">
        <span className="line-clamp-3 whitespace-pre-line break-words group-open:line-clamp-none">{body}</span>
        <span className="mt-1 inline-block text-xs text-taupe underline underline-offset-4 transition-colors hover:text-ink">
          <span className="group-open:hidden">Read full review</span>
          <span className="hidden group-open:inline">Show less</span>
        </span>
      </summary>
    </details>
  );
}

function ReviewRow({ review, selected, onSelect }: { review: ReviewItem; selected: boolean; onSelect: (checked: boolean) => void }) {
  const r = review;
  const iconCls = 'h-3.5 w-3.5';
  return (
    <li className={cn('flex gap-3 border-b border-line/70 px-4 py-4 transition-colors last:border-0 sm:gap-4 sm:px-5', selected && 'bg-ivory')}>
      <input
        type="checkbox"
        checked={selected}
        onChange={(e) => onSelect(e.target.checked)}
        aria-label={`Select review “${r.title}” by ${r.authorName}`}
        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-ink"
      />
      <div className="min-w-0 flex-1 sm:flex sm:items-start sm:gap-6">
        <article className="min-w-0 flex-1" aria-label={`Review by ${r.authorName}`}>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <Stars rating={r.rating} size={13} />
            <span className="text-xs tabular-nums text-taupe">{r.rating}/5</span>
            <StatusBadge status={r.status} />
            {r.isVerified && (
              <Badge tone="success" title="Left by a customer with a matching order">
                <BadgeCheck className="h-3 w-3" strokeWidth={1.75} aria-hidden />
                Verified buyer
              </Badge>
            )}
          </div>
          <h3 className="mt-2 break-words text-[16px] font-medium leading-snug text-ink">{r.title}</h3>
          <ReviewBody body={r.body} />
          <p className="mt-2.5 text-xs text-taupe">
            <span className="font-medium text-charcoal">{r.authorName}</span>
            {r.location && <> · {r.location}</>} ·{' '}
            <time dateTime={r.createdAt} title={formatDate(r.createdAt, { dateStyle: 'full' })} suppressHydrationWarning>
              {formatRelative(r.createdAt)}
            </time>
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-taupe">
            <span>
              On{' '}
              <Link href={`/admin/products/${r.productId}`} className="text-ink underline-offset-4 hover:underline">
                {r.product.name}
              </Link>
            </span>
            <a
              href={`/products/${encodeURIComponent(r.product.slug)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 underline-offset-4 transition-colors hover:text-ink hover:underline"
            >
              View on store
              <ExternalLink className="h-3 w-3" strokeWidth={1.5} aria-hidden />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </p>
        </article>
        <div className="mt-3 flex flex-wrap items-center gap-2 sm:mt-0 sm:w-[136px] sm:shrink-0 sm:flex-col sm:items-stretch">
          {r.status !== 'APPROVED' && (
            <ActionButton action={() => setReviewStatus(r.id, 'APPROVED')} variant="primary" size="xs" icon={<Check className={iconCls} strokeWidth={1.75} aria-hidden />}>
              Approve
            </ActionButton>
          )}
          {r.status !== 'REJECTED' && (
            <ActionButton action={() => setReviewStatus(r.id, 'REJECTED')} variant="outline" size="xs" icon={<X className={iconCls} strokeWidth={1.75} aria-hidden />}>
              Reject
            </ActionButton>
          )}
          <ActionButton
            action={() => deleteReview(r.id)}
            variant="ghost"
            size="xs"
            className="text-danger hover:bg-danger/[0.06]"
            icon={<Trash2 className={iconCls} strokeWidth={1.5} aria-hidden />}
            confirm={{
              title: 'Delete this review?',
              description: (
                <>
                  “{r.title}” by {r.authorName} will be permanently removed{r.status === 'APPROVED' ? ' and the product’s rating recalculated' : ''}. This can’t be undone — reject it instead if you may want it back.
                </>
              ),
              confirmLabel: 'Delete review',
            }}
          >
            Delete
          </ActionButton>
        </div>
      </div>
    </li>
  );
}

/** Moderation list with per-row actions and bulk approve / reject for the current page. */
export function ReviewQueue({ reviews }: { reviews: ReviewItem[] }) {
  const [picked, setPicked] = useState<string[]>([]);
  const allRef = useRef<HTMLInputElement>(null);

  // Drop selections that are no longer on the page (e.g. approved out of the Pending tab).
  const selected = useMemo(() => {
    const visible = new Set(reviews.map((r) => r.id));
    return picked.filter((id) => visible.has(id));
  }, [picked, reviews]);
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const allChecked = reviews.length > 0 && selected.length === reviews.length;
  const someChecked = selected.length > 0 && !allChecked;

  useEffect(() => {
    if (allRef.current) allRef.current.indeterminate = someChecked;
  }, [someChecked]);

  const toggle = (id: string, checked: boolean) => setPicked((prev) => (checked ? [...prev.filter((x) => x !== id), id] : prev.filter((x) => x !== id)));
  const toggleAll = (checked: boolean) => setPicked(checked ? reviews.slice(0, MAX_BULK).map((r) => r.id) : []);
  const clearOnSuccess = (res: ActionResult) => {
    if (res.ok) setPicked([]);
  };

  const n = selected.length;
  const ids = selected.slice(0, MAX_BULK);

  return (
    <div className="border border-line bg-white">
      <div className="flex min-h-[48px] flex-wrap items-center gap-x-4 gap-y-2 border-b border-line bg-ivory/70 px-4 py-2 sm:px-5" aria-label="Bulk actions" role="toolbar">
        <label className="flex cursor-pointer items-center gap-3 text-xs text-charcoal sm:gap-4">
          <input ref={allRef} type="checkbox" checked={allChecked} onChange={(e) => toggleAll(e.target.checked)} className="h-4 w-4 cursor-pointer accent-ink" aria-label="Select all reviews on this page" />
          <span aria-live="polite">{n ? `${n} selected` : 'Select all on this page'}</span>
        </label>
        {n > 0 && (
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <ActionButton action={() => bulkSetReviewStatus(ids, 'APPROVED')} variant="primary" size="xs" onDone={clearOnSuccess} icon={<Check className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />}>
              Approve {n}
            </ActionButton>
            <ActionButton action={() => bulkSetReviewStatus(ids, 'REJECTED')} variant="outline" size="xs" onDone={clearOnSuccess} icon={<X className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />}>
              Reject {n}
            </ActionButton>
            <button type="button" onClick={() => setPicked([])} className="px-2 text-xs text-taupe underline-offset-4 hover:text-ink hover:underline">
              Clear
            </button>
          </div>
        )}
      </div>
      <ul>
        {reviews.map((r) => (
          <ReviewRow key={r.id} review={r} selected={selectedSet.has(r.id)} onSelect={(checked) => toggle(r.id, checked)} />
        ))}
      </ul>
    </div>
  );
}
