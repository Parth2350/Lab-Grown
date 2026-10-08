import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ExternalLink, ImageOff, Mail, Phone } from 'lucide-react';
import { site } from '@/config/site';
import { pageMeta } from '@/lib/seo';
import { requireAdmin } from '@/lib/server/auth';
import { deleteBespokeRequest } from '@/lib/server/admin/actions/bespoke';
import { getBespokeRequest } from '@/lib/server/admin/queries/bespoke';
import { BespokeNotesForm } from '@/components/admin/bespoke/BespokeNotesForm';
import { BespokeStatusControl } from '@/components/admin/bespoke/BespokeStatusControl';
import { DeleteAndReturn } from '@/components/admin/bespoke/DeleteAndReturn';
import { mailtoHref, safeUrl, telHref } from '@/components/admin/bespoke/links';
import { bespokeReference } from '@/components/admin/bespoke/status';
import { formatDate, formatDateTime, formatRelative } from '@/components/admin/format';
import { DescList, PageHeader, Panel, StatusBadge } from '@/components/admin/ui';
import { buttonClass } from '@/components/ui/Button';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  // Title uses the reference only — no customer data in metadata.
  return pageMeta({ title: `Bespoke request ${bespokeReference(id)}`, path: `/admin/bespoke/${encodeURIComponent(id)}`, noIndex: true });
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default async function BespokeRequestPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  if (!id || id.length > 64) notFound();
  const r = await getBespokeRequest(id);
  if (!r) notFound();

  const reference = bespokeReference(r.id);
  const mailto = mailtoHref(r.email, `Your bespoke ${r.jewelryType} request — ${site.name}`);
  const tel = telHref(r.phone);
  const images = r.inspirationUrls.map((u) => safeUrl(u)).filter((u): u is string => Boolean(u));
  const hiddenImages = r.inspirationUrls.length - images.length;

  return (
    <>
      <PageHeader
        back={{ href: '/admin/bespoke', label: 'Bespoke requests' }}
        eyebrow={reference}
        title={r.name}
        description={
          <>
            {r.jewelryType} · received {formatDate(r.createdAt)} ({formatRelative(r.createdAt)})
          </>
        }
        actions={
          <>
            <StatusBadge status={r.status} />
            {mailto && (
              <a href={mailto} className={buttonClass('primary', 'sm')}>
                <Mail className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
                Reply by email
              </a>
            )}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          <Panel title="The brief">
            <DescList
              items={[
                ['Piece', r.jewelryType],
                ['Shape', r.shape ? capitalize(r.shape) : null],
                ['Carat', r.carat],
                ['Metal', r.metal],
                ['Budget', r.budget],
              ]}
            />
          </Panel>

          <Panel title="Client notes" description="In the client’s own words.">
            {r.notes ? (
              <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed text-charcoal">{r.notes}</p>
            ) : (
              <p className="text-[15px] text-taupe">The client didn’t add any notes.</p>
            )}
          </Panel>

          <Panel
            title="Inspiration"
            description={images.length ? `${images.length} image${images.length === 1 ? '' : 's'} shared by the client — open any to view full size.` : undefined}
          >
            {images.length ? (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                {images.map((url, i) => (
                  <li key={`${url}-${i}`}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="group relative block aspect-square overflow-hidden border border-line bg-porcelain focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-ink"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary customer uploads, shown as-is */}
                      <img
                        src={url}
                        alt={`Inspiration image ${i + 1} of ${images.length}`}
                        loading="lazy"
                        decoding="async"
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover transition-transform duration-500 ease-luxe group-hover:scale-[1.03]"
                      />
                      <span className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center bg-white/90 text-ink opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" aria-hidden>
                        <ExternalLink className="h-3 w-3" strokeWidth={1.5} />
                      </span>
                      <span className="sr-only">(opens full size in a new tab)</span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 border border-dashed border-line bg-ivory/60 px-6 py-10 text-center">
                <ImageOff className="h-5 w-5 text-taupe" strokeWidth={1.25} aria-hidden />
                <p className="text-[15px] text-taupe">No inspiration images</p>
              </div>
            )}
            {hiddenImages > 0 && (
              <p className="mt-3 text-xs text-taupe">
                {hiddenImages} attachment{hiddenImages === 1 ? ' was' : 's were'} hidden because {hiddenImages === 1 ? 'it is' : 'they are'} not a valid web address.
              </p>
            )}
          </Panel>
        </div>

        <aside className="min-w-0 space-y-6" aria-label="Request management">
          <Panel title="Status">
            <BespokeStatusControl id={r.id} status={r.status} />
          </Panel>

          <Panel title="Client">
            <DescList
              items={[
                ['Name', r.name],
                ['Email', mailto ? <a href={mailto} className="break-all text-ink underline-offset-4 hover:underline">{r.email}</a> : <span className="break-all">{r.email}</span>],
                ['Phone', r.phone ? tel ? <a href={tel} className="text-ink underline-offset-4 hover:underline">{r.phone}</a> : r.phone : null],
                ['Country', r.country],
              ]}
            />
            {(mailto || tel) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {mailto && (
                  <a href={mailto} className={buttonClass('outline', 'sm', 'flex-1')}>
                    <Mail className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
                    Email
                  </a>
                )}
                {tel && (
                  <a href={tel} className={buttonClass('outline', 'sm', 'flex-1')}>
                    <Phone className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
                    Call
                  </a>
                )}
              </div>
            )}
          </Panel>

          <Panel title="Internal notes" description="Only visible to the admin team.">
            <BespokeNotesForm id={r.id} notes={r.adminNotes} />
          </Panel>

          <Panel title="Record">
            <DescList
              items={[
                ['Reference', reference],
                ['Received', formatDateTime(r.createdAt)],
                ['Last updated', formatDateTime(r.updatedAt)],
              ]}
            />
            <div className="mt-4 border-t border-line pt-4">
              <DeleteAndReturn
                action={deleteBespokeRequest.bind(null, r.id)}
                href="/admin/bespoke"
                title="Delete this bespoke request?"
                description={
                  <>
                    {r.name}’s {r.jewelryType.toLowerCase()} request ({reference}) and your internal notes will be permanently removed. This can’t be undone — consider closing it instead.
                  </>
                }
                confirmLabel="Delete request"
                className="w-full"
              >
                Delete request
              </DeleteAndReturn>
            </div>
          </Panel>
        </aside>
      </div>
    </>
  );
}
