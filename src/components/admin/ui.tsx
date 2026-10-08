/**
 * Admin UI primitives — server-compatible (no hooks), square corners, thin borders,
 * dense but calm. Client-side pieces live in sibling files (ActionButton, ConfirmDialog …).
 */
import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { enumLabel, formatNumber } from './format';

// ───────────────────────────── layout ─────────────────────────────

export function PageHeader({
  title,
  description,
  actions,
  back,
  eyebrow,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
  eyebrow?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {back && (
          <Link href={back.href} className="mb-2 inline-flex items-center gap-1.5 text-xs text-taupe transition-colors hover:text-ink">
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
            {back.label}
          </Link>
        )}
        {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
        <h1 className="font-serif text-[1.9rem] leading-tight text-ink">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-[15px] text-taupe">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function Panel({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
  id,
  footer,
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  id?: string;
  footer?: ReactNode;
}) {
  return (
    <section id={id} className={cn('border border-line bg-white', className)}>
      {(title || actions) && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-3.5">
          <div className="min-w-0">
            {title && <h2 className="font-sans text-[15px] font-medium uppercase tracking-[0.12em] text-ink">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-taupe">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={cn('p-5', bodyClassName)}>{children}</div>
      {footer && <div className="border-t border-line bg-ivory/60 px-5 py-3">{footer}</div>}
    </section>
  );
}

export function DescList({ items, className }: { items: [ReactNode, ReactNode][]; className?: string }) {
  return (
    <dl className={cn('grid grid-cols-[minmax(110px,auto)_1fr] gap-x-4 gap-y-2 text-[15px]', className)}>
      {items.map(([k, v], i) => (
        <div key={i} className="contents">
          <dt className="text-taupe">{k}</dt>
          <dd className="min-w-0 break-words text-ink">{v ?? <span className="text-taupe">—</span>}</dd>
        </div>
      ))}
    </dl>
  );
}

// ───────────────────────────── badges ─────────────────────────────

export type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'gold';

const TONES: Record<Tone, string> = {
  neutral: 'border-line bg-porcelain text-charcoal',
  info: 'border-[#C9D6E3] bg-[#EEF3F8] text-[#2F5577]',
  success: 'border-success/25 bg-success/10 text-success',
  warning: 'border-[#E6CF9E] bg-[#FBF3E1] text-[#7A5718]',
  danger: 'border-danger/25 bg-danger/[0.07] text-danger',
  gold: 'border-gold/30 bg-gold-pale text-gold-deep',
};

const DOTS: Record<Tone, string> = {
  neutral: 'bg-taupe',
  info: 'bg-[#3A6EA5]',
  success: 'bg-success',
  warning: 'bg-[#C08A1E]',
  danger: 'bg-danger',
  gold: 'bg-gold',
};

export function Badge({ tone = 'neutral', children, dot, className, title }: { tone?: Tone; children: ReactNode; dot?: boolean; className?: string; title?: string }) {
  return (
    <span title={title} className={cn('inline-flex items-center gap-1.5 whitespace-nowrap border px-2 py-0.5 text-[13px] font-medium leading-4', TONES[tone], className)}>
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', DOTS[tone])} aria-hidden />}
      {children}
    </span>
  );
}

const STATUS_TONE: Record<string, Tone> = {
  // OrderStatus
  PENDING: 'warning',
  PAID: 'info',
  PROCESSING: 'info',
  SHIPPED: 'gold',
  DELIVERED: 'success',
  CANCELLED: 'neutral',
  REFUNDED: 'danger',
  // PaymentStatus
  CAPTURED: 'success',
  FAILED: 'danger',
  // ShipmentStatus
  PACKED: 'info',
  IN_TRANSIT: 'gold',
  OUT_FOR_DELIVERY: 'gold',
  RETURNED: 'danger',
  // Review / Application / Return
  APPROVED: 'success',
  REJECTED: 'danger',
  REQUESTED: 'warning',
  RECEIVED: 'info',
  // RequestStatus
  NEW: 'warning',
  IN_REVIEW: 'info',
  QUOTED: 'gold',
  IN_PRODUCTION: 'info',
  COMPLETED: 'success',
  CLOSED: 'neutral',
  // misc
  ACTIVE: 'success',
  INACTIVE: 'neutral',
  ADMIN: 'gold',
  CUSTOMER: 'neutral',
};

/** Any Prisma status enum value → labelled badge with a status dot (never colour alone). */
export function StatusBadge({ status, label, className }: { status: string; label?: string; className?: string }) {
  return (
    <Badge tone={STATUS_TONE[status] ?? 'neutral'} dot className={className}>
      {label ?? enumLabel(status)}
    </Badge>
  );
}

export function ActiveBadge({ active, on = 'Active', off = 'Hidden' }: { active: boolean; on?: string; off?: string }) {
  return <StatusBadge status={active ? 'ACTIVE' : 'INACTIVE'} label={active ? on : off} />;
}

// ───────────────────────────── empty / tables ─────────────────────────────

export function EmptyState({ icon, title, description, action, className }: { icon?: ReactNode; title: string; description?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
      {icon && <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-line bg-ivory text-taupe">{icon}</div>}
      <p className="font-serif text-xl text-ink">{title}</p>
      {description && <p className="mt-1 max-w-sm text-[15px] text-taupe">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** Horizontal-scrolling table frame. Put a <table className={table.base}> inside. */
export function TableWrap({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('relative overflow-x-auto border border-line bg-white', className)}>{children}</div>;
}

/** Shared table class names so every list looks the same. */
export const table = {
  base: 'w-full min-w-[720px] border-collapse text-left text-[15px] tabular-nums',
  head: 'border-b border-line bg-ivory/70',
  th: 'whitespace-nowrap px-4 py-2.5 text-[12.5px] font-medium uppercase tracking-[0.14em] text-taupe',
  thRight: 'whitespace-nowrap px-4 py-2.5 text-right text-[12.5px] font-medium uppercase tracking-[0.14em] text-taupe',
  row: 'border-b border-line/70 last:border-0 transition-colors hover:bg-ivory',
  td: 'px-4 py-3 align-middle text-ink',
  tdRight: 'px-4 py-3 text-right align-middle text-ink',
  tdMuted: 'px-4 py-3 align-middle text-taupe',
};

// ───────────────────────────── filters & pagination ─────────────────────────────

function href(basePath: string, params: Record<string, string | undefined>) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) qs.set(k, v);
  const s = qs.toString();
  return s ? `${basePath}?${s}` : basePath;
}

/** Build a link that keeps the current filters but overrides some keys (page resets unless given). */
export function withParams(basePath: string, current: Record<string, string>, patch: Record<string, string | undefined>) {
  const next: Record<string, string | undefined> = { ...current, page: undefined, ...patch };
  return href(basePath, next);
}

export function Pagination({
  page,
  pageCount,
  total,
  pageSize,
  basePath,
  params,
  noun = 'results',
}: {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  basePath: string;
  params: Record<string, string>;
  noun?: string;
}) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const link = (p: number) => withParams(basePath, params, { page: p > 1 ? String(p) : undefined });
  const pages = Array.from(new Set([1, page - 1, page, page + 1, pageCount].filter((p) => p >= 1 && p <= pageCount))).sort((a, b) => a - b);
  const btn = 'inline-flex h-8 min-w-8 items-center justify-center border border-line bg-white px-2 text-xs text-ink transition-colors hover:border-ink';
  return (
    <nav aria-label="Pagination" className="mt-4 flex flex-col items-center justify-between gap-3 text-xs text-taupe sm:flex-row">
      <p>
        {total === 0 ? `No ${noun}` : `Showing ${formatNumber(from)}–${formatNumber(to)} of ${formatNumber(total)} ${noun}`}
      </p>
      {pageCount > 1 && (
        <div className="flex items-center gap-1">
          {page > 1 ? (
            <Link href={link(page - 1)} className={btn} aria-label="Previous page">
              <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
            </Link>
          ) : (
            <span className={cn(btn, 'pointer-events-none opacity-40')} aria-hidden>
              <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
            </span>
          )}
          {pages.map((p, i) => (
            <span key={p} className="flex items-center gap-1">
              {i > 0 && p - pages[i - 1] > 1 && <span className="px-1">…</span>}
              <Link href={link(p)} aria-current={p === page ? 'page' : undefined} className={cn(btn, p === page && 'border-ink bg-ink text-ivory hover:bg-ink')}>
                {p}
              </Link>
            </span>
          ))}
          {page < pageCount ? (
            <Link href={link(page + 1)} className={btn} aria-label="Next page">
              <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
            </Link>
          ) : (
            <span className={cn(btn, 'pointer-events-none opacity-40')} aria-hidden>
              <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
            </span>
          )}
        </div>
      )}
    </nav>
  );
}

/** Link tabs (e.g. order status) with optional counts. Server-rendered. */
export function Tabs({
  tabs,
  active,
  basePath,
  params,
  param = 'status',
}: {
  tabs: { value: string; label: string; count?: number }[];
  active: string;
  basePath: string;
  params: Record<string, string>;
  param?: string;
}) {
  return (
    <div className="no-scrollbar -mx-1 mb-4 flex gap-1 overflow-x-auto border-b border-line px-1" role="tablist">
      {tabs.map((t) => {
        const isActive = t.value === active;
        return (
          <Link
            key={t.value || 'all'}
            role="tab"
            aria-selected={isActive}
            href={withParams(basePath, params, { [param]: t.value || undefined })}
            className={cn(
              '-mb-px inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-[14.5px] transition-colors',
              isActive ? 'border-ink text-ink' : 'border-transparent text-taupe hover:text-ink',
            )}
          >
            {t.label}
            {t.count != null && (
              <span className={cn('min-w-5 px-1.5 text-center text-[12.5px] leading-[18px] tabular-nums', isActive ? 'bg-ink text-ivory' : 'bg-porcelain text-charcoal')}>
                {formatNumber(t.count)}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}

/** GET form wrapper for list filters — works without JS; pair with <AutoSubmit> for selects. */
export function FilterBar({ children, action, className }: { children: ReactNode; action: string; className?: string }) {
  return (
    <form method="get" action={action} role="search" className={cn('mb-4 flex flex-wrap items-end gap-2', className)}>
      {children}
    </form>
  );
}

/** Small admin-density input classes (pair with the global `field` utility). */
export const fieldSm = 'field h-9 px-3 py-0 text-[15px]';
export const selectSm = 'field h-9 cursor-pointer appearance-none py-0 pl-3 pr-8 text-[15px]';
export const selectChevron = {
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23141311' stroke-width='1.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 0.6rem center',
  backgroundSize: '11px',
} as const;

export function FilterLabel({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-[12.5px] font-medium uppercase tracking-[0.14em] text-taupe">
      {children}
    </label>
  );
}

/** Small numeric stat used inside panels */
export function MiniStat({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div>
      <p className="text-[12.5px] font-medium uppercase tracking-[0.14em] text-taupe">{label}</p>
      <p className="mt-1 text-lg font-normal text-ink">{value}</p>
      {hint && <p className="text-xs text-taupe">{hint}</p>}
    </div>
  );
}
