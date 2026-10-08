import Link from 'next/link';
import { ArrowLeft, Inbox, Mail, MailCheck, MailOpen, Phone, Reply, Search } from 'lucide-react';
import { pageMeta } from '@/lib/seo';
import { requireAdmin } from '@/lib/server/auth';
import { cleanParams, pageCount, paging, sp, spEnum, type SearchParams } from '@/lib/server/admin/list';
import { deleteMessage, markAllMessagesRead, setMessageRead } from '@/lib/server/admin/actions/messages';
import { countUnreadMessages, getMessage, listMessages, MESSAGE_FILTERS, type MessageFilter } from '@/lib/server/admin/queries/messages';
import { DeleteAndReturn } from '@/components/admin/bespoke/DeleteAndReturn';
import { mailtoHref, telHref } from '@/components/admin/bespoke/links';
import { formatDateTime, formatNumber, formatRelative } from '@/components/admin/format';
import { ActionButton } from '@/components/admin/forms';
import { Badge, EmptyState, FilterBar, FilterLabel, PageHeader, Pagination, Tabs, fieldSm, withParams } from '@/components/admin/ui';
import { Button, buttonClass } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export const metadata = pageMeta({ title: 'Messages', path: '/admin/messages', noIndex: true });

const PAGE_SIZE = 25;
const BASE = '/admin/messages';

const FILTER_LABEL: Record<MessageFilter, string> = { all: 'All', unread: 'Unread', read: 'Read' };

export default async function MessagesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin();
  const params = await searchParams;
  const filter = spEnum(params, 'filter', MESSAGE_FILTERS, 'all');
  const q = sp(params, 'q').slice(0, 100);
  const selectedId = sp(params, 'id').slice(0, 64);
  const { page, pageSize, skip, take } = paging(params, PAGE_SIZE);

  const [{ rows, counts, total }, selected, unreadTotal] = await Promise.all([
    listMessages({ filter, q, skip, take }),
    selectedId ? getMessage(selectedId) : Promise.resolve(null),
    countUnreadMessages(),
  ]);

  const current = cleanParams(params);
  const listParams: Record<string, string> = { ...current };
  delete listParams.id;
  const listHref = withParams(BASE, listParams, { page: current.page });
  const openHref = (id: string) => withParams(BASE, current, { id, page: current.page });

  const mailto = selected ? mailtoHref(selected.email, `Re: ${selected.subject}`) : null;
  const tel = selected ? telHref(selected.phone) : null;

  return (
    <>
      <PageHeader
        title="Messages"
        description="Enquiries sent through the Contact page. Opening a message doesn’t change its status — mark it read once it’s been handled."
        actions={
          <ActionButton
            action={markAllMessagesRead}
            variant="outline"
            disabled={unreadTotal === 0}
            title={unreadTotal === 0 ? 'No unread messages' : undefined}
            icon={<MailCheck className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />}
          >
            Mark all as read{unreadTotal ? ` (${formatNumber(unreadTotal)})` : ''}
          </ActionButton>
        }
      />

      <Tabs
        tabs={MESSAGE_FILTERS.map((f) => ({ value: f === 'all' ? '' : f, label: FILTER_LABEL[f], count: counts[f] }))}
        active={filter === 'all' ? '' : filter}
        basePath={BASE}
        params={listParams}
        param="filter"
      />

      <FilterBar action={BASE}>
        {filter !== 'all' && <input type="hidden" name="filter" value={filter} />}
        <div className="w-full sm:w-72">
          <FilterLabel htmlFor="messages-q">Search</FilterLabel>
          <input id="messages-q" type="search" name="q" defaultValue={q} maxLength={100} placeholder="Name, email, subject or text" className={fieldSm} />
        </div>
        <Button type="submit" size="sm" variant="outline">
          <Search className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
          Search
        </Button>
        {q && (
          <Link href={filter === 'all' ? BASE : `${BASE}?filter=${filter}`} className="inline-flex h-9 items-center px-2 text-xs text-taupe underline-offset-4 hover:text-ink hover:underline">
            Clear search
          </Link>
        )}
      </FilterBar>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:items-start">
        {/* ── list ── (hidden on small screens while a message is open) */}
        <section aria-label="Messages" className={cn('min-w-0', selectedId && 'hidden lg:block')}>
          <div className="border border-line bg-white">
            {rows.length === 0 && total > 0 ? (
              <EmptyState
                title="Nothing on this page"
                description="This page is past the end of the inbox."
                action={
                  <Link href={withParams(BASE, listParams, {})} className="text-xs text-ink underline underline-offset-4">
                    Go to the first page
                  </Link>
                }
              />
            ) : rows.length === 0 ? (
              <EmptyState
                icon={<Inbox className="h-5 w-5" strokeWidth={1.25} />}
                title={q ? 'No messages match' : filter === 'unread' ? 'Inbox zero' : 'No messages'}
                description={q ? 'Try a different search.' : filter === 'unread' ? 'Every message has been read.' : 'Messages from the Contact page will appear here.'}
              />
            ) : (
              <ul>
                {rows.map((m) => {
                  const isSelected = m.id === selectedId;
                  const unread = !m.isRead;
                  return (
                    <li key={m.id} className="border-b border-line/70 last:border-0">
                      <Link
                        href={openHref(m.id)}
                        aria-current={isSelected ? 'true' : undefined}
                        className={cn(
                          'block border-l-2 px-4 py-3 transition-colors focus-visible:bg-ivory focus-visible:outline-none',
                          isSelected ? 'border-l-ink bg-porcelain' : 'border-l-transparent hover:bg-ivory',
                        )}
                      >
                        <div className="flex items-center gap-2">
                          {unread ? <span className="h-2 w-2 shrink-0 rounded-full bg-gold" aria-hidden /> : <span className="h-2 w-2 shrink-0" aria-hidden />}
                          <span className={cn('min-w-0 truncate text-[15px]', unread ? 'font-semibold text-ink' : 'text-charcoal')}>{m.name}</span>
                          {unread && <span className="sr-only">(unread)</span>}
                          <time dateTime={m.createdAt.toISOString()} title={formatDateTime(m.createdAt)} className="ml-auto shrink-0 text-[13px] tabular-nums text-taupe">
                            {formatRelative(m.createdAt)}
                          </time>
                        </div>
                        <p className={cn('mt-0.5 truncate pl-4 text-[15px]', unread ? 'font-medium text-ink' : 'text-charcoal')}>{m.subject}</p>
                        <p className="mt-0.5 line-clamp-1 break-all pl-4 text-xs text-taupe">{m.message}</p>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <Pagination page={page} pageCount={pageCount(total, pageSize)} total={total} pageSize={pageSize} basePath={BASE} params={listParams} noun="messages" />
        </section>

        {/* ── reading pane ── */}
        <section aria-label="Selected message" className={cn('min-w-0', !selectedId && 'hidden lg:block')}>
          {selectedId && (
            <Link href={listHref} className="mb-3 inline-flex items-center gap-1.5 text-xs text-taupe hover:text-ink lg:hidden">
              <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
              Back to inbox
            </Link>
          )}
          {selected ? (
            <article className="border border-line bg-white" aria-labelledby="message-subject">
              <header className="border-b border-line px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h2 id="message-subject" className="min-w-0 break-words text-[19px] font-medium leading-snug text-ink">
                    {selected.subject}
                  </h2>
                  <Badge tone={selected.isRead ? 'neutral' : 'gold'} dot>
                    {selected.isRead ? 'Read' : 'Unread'}
                  </Badge>
                </div>
                <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[15px]">
                  <dt className="text-taupe">From</dt>
                  <dd className="min-w-0 break-words text-ink">
                    {selected.name}{' '}
                    {mailto ? (
                      <a href={mailto} className="break-all text-taupe underline-offset-4 hover:text-ink hover:underline">
                        &lt;{selected.email}&gt;
                      </a>
                    ) : (
                      <span className="break-all text-taupe">&lt;{selected.email}&gt;</span>
                    )}
                  </dd>
                  {selected.phone && (
                    <>
                      <dt className="text-taupe">Phone</dt>
                      <dd className="text-ink">
                        {tel ? (
                          <a href={tel} className="underline-offset-4 hover:underline">
                            {selected.phone}
                          </a>
                        ) : (
                          selected.phone
                        )}
                      </dd>
                    </>
                  )}
                  <dt className="text-taupe">Received</dt>
                  <dd className="text-ink">
                    {formatDateTime(selected.createdAt)} <span className="text-taupe">({formatRelative(selected.createdAt)})</span>
                  </dd>
                </dl>
              </header>

              <div className="flex flex-wrap items-center gap-2 border-b border-line bg-ivory/60 px-5 py-2.5" role="toolbar" aria-label="Message actions">
                {mailto && (
                  <a href={mailto} className={buttonClass('primary', 'sm')}>
                    <Reply className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
                    Reply
                  </a>
                )}
                {tel && (
                  <a href={tel} className={buttonClass('outline', 'sm')}>
                    <Phone className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
                    Call
                  </a>
                )}
                <ActionButton
                  action={setMessageRead.bind(null, selected.id, !selected.isRead)}
                  variant="outline"
                  icon={selected.isRead ? <Mail className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden /> : <MailOpen className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />}
                >
                  {selected.isRead ? 'Mark as unread' : 'Mark as read'}
                </ActionButton>
                <div className="ml-auto">
                  <DeleteAndReturn
                    action={deleteMessage.bind(null, selected.id)}
                    href={listHref}
                    title="Delete this message?"
                    description={<>The message from {selected.name} will be permanently removed. This can’t be undone.</>}
                    confirmLabel="Delete message"
                  >
                    Delete
                  </DeleteAndReturn>
                </div>
              </div>

              <div className="px-5 py-5">
                <p className="whitespace-pre-wrap break-words text-[16px] leading-relaxed text-charcoal">{selected.message}</p>
              </div>
            </article>
          ) : (
            <div className="border border-line bg-white">
              {selectedId ? (
                <EmptyState
                  icon={<Inbox className="h-5 w-5" strokeWidth={1.25} />}
                  title="Message not found"
                  description="It may have been deleted."
                  action={
                    <Link href={listHref} className="text-xs text-ink underline underline-offset-4">
                      Back to inbox
                    </Link>
                  }
                />
              ) : (
                <EmptyState icon={<MailOpen className="h-5 w-5" strokeWidth={1.25} />} title="Select a message" description="Choose a message from the list to read it here." />
              )}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
