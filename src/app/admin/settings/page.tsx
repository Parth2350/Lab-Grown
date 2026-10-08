import Link from 'next/link';
import { ArrowRight, Truck } from 'lucide-react';
import { pageMeta } from '@/lib/seo';
import { requireAdmin } from '@/lib/server/auth';
import { db } from '@/lib/server/db';
import { readStoreSettings } from '@/lib/server/admin/settings';
import { AnnouncementsForm } from '@/components/admin/settings/AnnouncementsForm';
import { HeroForm } from '@/components/admin/settings/HeroForm';
import { PopularSearchesForm } from '@/components/admin/settings/PopularSearchesForm';
import { InventoryForm, ReturnsForm, TaxForm } from '@/components/admin/settings/StoreRulesForms';
import { formatDateTime, formatRelative } from '@/components/admin/format';
import { PageHeader } from '@/components/admin/ui';

export const metadata = pageMeta({ title: 'Settings', path: '/admin/settings', noIndex: true });

const SECTIONS = [
  { href: '#announcements', label: 'Announcement bar' },
  { href: '#hero', label: 'Hero' },
  { href: '#tax', label: 'Tax' },
  { href: '#returns', label: 'Returns' },
  { href: '#inventory', label: 'Inventory' },
  { href: '#popular-searches', label: 'Popular searches' },
];

export default async function SettingsPage() {
  await requireAdmin();
  const [settings, row] = await Promise.all([readStoreSettings(), db.setting.findUnique({ where: { key: 'store' }, select: { updatedAt: true } })]);

  return (
    <>
      <PageHeader
        title="Settings"
        description="Store-wide copy and rules. Each section saves on its own and goes live on the storefront immediately."
        actions={
          <p className="text-xs text-taupe">
            {row ? (
              <>
                Last updated <time dateTime={row.updatedAt.toISOString()} title={formatDateTime(row.updatedAt)} className="text-charcoal">{formatRelative(row.updatedAt)}</time>
                <span className="hidden sm:inline"> · {formatDateTime(row.updatedAt)}</span>
              </>
            ) : (
              'Using default settings — nothing saved yet'
            )}
          </p>
        }
      />

      <nav aria-label="Settings sections" className="no-scrollbar -mx-1 mb-5 flex gap-1 overflow-x-auto px-1">
        {SECTIONS.map((s) => (
          <a key={s.href} href={s.href} className="shrink-0 border border-line bg-white px-3 py-1.5 text-xs text-charcoal transition-colors hover:border-ink hover:text-ink">
            {s.label}
          </a>
        ))}
      </nav>

      <div className="mb-6 flex flex-wrap items-center gap-3 border border-line bg-ivory px-4 py-3 text-[15px] text-charcoal">
        <Truck className="h-4 w-4 shrink-0 text-gold" strokeWidth={1.4} aria-hidden />
        <p className="min-w-0 flex-1">Shipping methods, rates and delivery estimates are edited on the Shipping page.</p>
        <Link href="/admin/shipping" className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.14em] text-ink underline-offset-4 hover:underline">
          Shipping
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
        </Link>
      </div>

      <div className="space-y-6">
        {/* Keys remount a section only when its own saved values change, so unsaved edits elsewhere survive. */}
        <AnnouncementsForm key={JSON.stringify(settings.announcements)} initial={settings.announcements} />
        <HeroForm key={JSON.stringify(settings.hero)} hero={settings.hero} />
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <TaxForm key={`${settings.taxRate}|${settings.taxLabel}`} taxRate={settings.taxRate} taxLabel={settings.taxLabel} />
          <ReturnsForm key={settings.returnsDays} returnsDays={settings.returnsDays} />
          <InventoryForm key={settings.lowStockThreshold} lowStockThreshold={settings.lowStockThreshold} />
        </div>
        <PopularSearchesForm key={JSON.stringify(settings.popularSearches)} initial={settings.popularSearches} />
      </div>
    </>
  );
}
