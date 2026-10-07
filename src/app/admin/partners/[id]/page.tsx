import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Check, ExternalLink, Mail, Phone, RotateCcw, X } from 'lucide-react';
import { site } from '@/config/site';
import { pageMeta } from '@/lib/seo';
import { requireAdmin } from '@/lib/server/auth';
import { deletePartnerApplication, setPartnerStatus } from '@/lib/server/admin/actions/partners';
import { getPartnerApplication } from '@/lib/server/admin/queries/partners';
import { DeleteAndReturn } from '@/components/admin/bespoke/DeleteAndReturn';
import { displayUrl, mailtoHref, safeWebsite, telHref } from '@/components/admin/bespoke/links';
import { formatDate, formatDateTime, formatRelative } from '@/components/admin/format';
import { ActionButton } from '@/components/admin/forms';
import { DescList, PageHeader, Panel, StatusBadge } from '@/components/admin/ui';
import { buttonClass } from '@/components/ui/Button';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  // Generic title — no applicant data in metadata.
  return pageMeta({ title: 'Partner application', path: `/admin/partners/${encodeURIComponent(id)}`, noIndex: true });
}

const DECISION_NOTE = {
  PENDING: 'Awaiting a decision.',
  APPROVED: 'Approved — reach out with onboarding details and their partner code.',
  REJECTED: 'Declined — kept for reference. You can reconsider at any time.',
} as const;

export default async function PartnerApplicationPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  if (!id || id.length > 64) notFound();
  const a = await getPartnerApplication(id);
  if (!a) notFound();

  const mailto = mailtoHref(a.email, `Your ${site.name} partner application`);
  const tel = telHref(a.phone);
  const website = safeWebsite(a.website);
  const icon = 'h-3.5 w-3.5';

  return (
    <>
      <PageHeader
        back={{ href: '/admin/partners', label: 'Partner applications' }}
        eyebrow="Partner application"
        title={a.name}
        description={
          <>
            {[a.company, a.country].filter(Boolean).join(' · ')} · applied {formatDate(a.createdAt)} ({formatRelative(a.createdAt)})
          </>
        }
        actions={
          <>
            <StatusBadge status={a.status} />
            {mailto && (
              <a href={mailto} className={buttonClass('primary', 'sm')}>
                <Mail className={icon} strokeWidth={1.5} aria-hidden />
                Reply by email
              </a>
            )}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          <Panel title="Application">
            <DescList
              items={[
                ['Company', a.company],
                [
                  'Website',
                  a.website ? (
                    website ? (
                      <a href={website} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 break-all text-ink underline-offset-4 hover:underline">
                        {displayUrl(website)}
                        <ExternalLink className="h-3 w-3 shrink-0" strokeWidth={1.5} aria-hidden />
                        <span className="sr-only">(opens in a new tab)</span>
                      </a>
                    ) : (
                      <span className="break-all" title="Not a valid web address — shown as text">
                        {a.website}
                      </span>
                    )
                  ) : null,
                ],
                ['Social handle', a.socialHandle],
                ['Audience size', a.audienceSize],
                ['Country', a.country],
              ]}
            />
          </Panel>

          <Panel title="Experience">
            {a.experience ? (
              <p className="whitespace-pre-wrap break-words text-[13px] leading-relaxed text-charcoal">{a.experience}</p>
            ) : (
              <p className="text-[13px] text-taupe">Not provided.</p>
            )}
          </Panel>

          <Panel title="Message">
            {a.message ? (
              <p className="whitespace-pre-wrap break-words text-[13px] leading-relaxed text-charcoal">{a.message}</p>
            ) : (
              <p className="text-[13px] text-taupe">The applicant didn’t include a message.</p>
            )}
          </Panel>
        </div>

        <aside className="min-w-0 space-y-6" aria-label="Application management">
          <Panel title="Decision">
            <div className="flex items-center gap-3">
              <StatusBadge status={a.status} />
              <p className="text-xs text-taupe">{DECISION_NOTE[a.status]}</p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {a.status !== 'APPROVED' && (
                <ActionButton
                  action={setPartnerStatus.bind(null, a.id, 'APPROVED')}
                  variant="primary"
                  className={a.status === 'REJECTED' ? 'col-span-2' : undefined}
                  icon={<Check className={icon} strokeWidth={1.75} aria-hidden />}
                  confirm={{ title: `Approve ${a.name}?`, description: 'The application will be marked approved. Remember to email them with onboarding details.', confirmLabel: 'Approve', tone: 'default' }}
                >
                  Approve
                </ActionButton>
              )}
              {a.status !== 'REJECTED' && (
                <ActionButton
                  action={setPartnerStatus.bind(null, a.id, 'REJECTED')}
                  variant="outline"
                  className={a.status === 'APPROVED' ? 'col-span-2' : undefined}
                  icon={<X className={icon} strokeWidth={1.75} aria-hidden />}
                  confirm={{ title: `Decline ${a.name}’s application?`, description: 'The application will be marked rejected and kept for reference. You can change this later.', confirmLabel: 'Reject' }}
                >
                  Reject
                </ActionButton>
              )}
            </div>
            {a.status !== 'PENDING' && (
              <div className="mt-3">
                <ActionButton action={setPartnerStatus.bind(null, a.id, 'PENDING')} variant="text" icon={<RotateCcw className="h-3 w-3" strokeWidth={1.75} aria-hidden />}>
                  Reset to pending
                </ActionButton>
              </div>
            )}
          </Panel>

          <Panel title="Contact">
            <DescList
              items={[
                ['Name', a.name],
                ['Email', mailto ? <a href={mailto} className="break-all text-ink underline-offset-4 hover:underline">{a.email}</a> : <span className="break-all">{a.email}</span>],
                ['Phone', a.phone ? tel ? <a href={tel} className="text-ink underline-offset-4 hover:underline">{a.phone}</a> : a.phone : null],
              ]}
            />
            {(mailto || tel) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {mailto && (
                  <a href={mailto} className={buttonClass('outline', 'sm', 'flex-1')}>
                    <Mail className={icon} strokeWidth={1.5} aria-hidden />
                    Email
                  </a>
                )}
                {tel && (
                  <a href={tel} className={buttonClass('outline', 'sm', 'flex-1')}>
                    <Phone className={icon} strokeWidth={1.5} aria-hidden />
                    Call
                  </a>
                )}
              </div>
            )}
          </Panel>

          <Panel title="Record">
            <DescList
              items={[
                ['Applied', formatDateTime(a.createdAt)],
                ['Last updated', formatDateTime(a.updatedAt)],
              ]}
            />
            <div className="mt-4 border-t border-line pt-4">
              <DeleteAndReturn
                action={deletePartnerApplication.bind(null, a.id)}
                href="/admin/partners"
                title="Delete this application?"
                description={<>{a.name}’s partner application will be permanently removed. This can’t be undone — reject it instead to keep a record.</>}
                confirmLabel="Delete application"
                className="w-full"
              >
                Delete application
              </DeleteAndReturn>
            </div>
          </Panel>
        </aside>
      </div>
    </>
  );
}
