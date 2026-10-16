import Link from 'next/link';
import { ArrowRight, Heart, LifeBuoy, MapPin, Package, RotateCcw, ShieldAlert } from 'lucide-react';
import { pageMeta } from '@/lib/seo';
import { requireUser } from '@/lib/server/auth';
import { db } from '@/lib/server/db';
import { formatDate, formatMoney, pluralize } from '@/lib/utils';
import { StatusBadge } from '@/components/commerce/OrderParts';
import { ListCount } from '@/components/account/ListCount';
import { PasswordForm, ProfileForm } from '@/components/account/ProfileForms';
import { ButtonLink } from '@/components/ui/Button';

export const metadata = pageMeta({ title: 'My Account', description: 'Your orders, details and saved pieces.', path: '/account', noIndex: true });

type Search = Promise<{ error?: string }>;

export default async function AccountOverview({ searchParams }: { searchParams: Search }) {
  const session = await requireUser('/account');
  const sp = await searchParams;
  const [user, orderCount, recent, defaultAddress] = await Promise.all([
    db.user.findUnique({ where: { id: session.id }, select: { name: true, email: true, phone: true, createdAt: true, passwordHash: true } }),
    db.order.count({ where: { userId: session.id } }),
    db.order.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: { number: true, status: true, total: true, createdAt: true, items: { select: { name: true, quantity: true } } },
    }),
    db.address.findFirst({ where: { userId: session.id }, orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }] }),
  ]);
  if (!user) return null;

  const quick = [
    { href: '/account/orders', label: 'Orders', text: 'Track and review purchases', icon: Package },
    { href: '/account/addresses', label: 'Addresses', text: 'Manage delivery addresses', icon: MapPin },
    { href: '/account/wishlist', label: 'Wishlist', text: 'Pieces you’ve saved', icon: Heart },
    { href: '/account/returns', label: 'Returns', text: 'Start or follow a return', icon: RotateCcw },
    { href: '/account/support', label: 'Concierge', text: 'Speak to a specialist', icon: LifeBuoy },
  ];

  return (
    <div className="space-y-14">
      {sp.error === 'forbidden' && (
        <p role="alert" className="flex items-start gap-3 border border-gold/40 bg-gold-pale/40 px-4 py-3 text-[15px] text-charcoal">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-gold-deep" strokeWidth={1.5} aria-hidden />
          That area is reserved for store administrators. You’ve been brought back to your account.
        </p>
      )}

      <section aria-label="At a glance" className="grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-4">
        {[
          { label: 'Orders', value: String(orderCount) },
          { label: 'Wishlist', value: <ListCount list="wishlist" /> },
          { label: 'Member since', value: formatDate(user.createdAt, { month: 'short', year: 'numeric' }) },
          { label: 'Default address', value: defaultAddress ? defaultAddress.city : '—' },
        ].map((s) => (
          <div key={s.label} className="bg-ivory px-5 py-5">
            <p className="text-[12.5px] uppercase tracking-[0.16em] text-taupe">{s.label}</p>
            <p className="mt-2 truncate font-serif text-2xl">{s.value}</p>
          </div>
        ))}
      </section>

      <section aria-labelledby="recent-title">
        <div className="mb-5 flex items-end justify-between gap-4">
          <h2 id="recent-title" className="font-serif text-3xl font-light">
            Recent orders
          </h2>
          {orderCount > 0 && (
            <Link href="/account/orders" className="label-caps group inline-flex items-center gap-2">
              <span className="link-underline">View all</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" strokeWidth={1.5} aria-hidden />
            </Link>
          )}
        </div>
        {recent.length ? (
          <ul className="divide-y divide-line border-y border-line">
            {recent.map((o) => (
              <li key={o.number}>
                <Link href={`/account/orders/${o.number}`} className="group flex flex-wrap items-center gap-x-6 gap-y-2 py-4 transition-colors hover:bg-porcelain/50 sm:px-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-[16px] text-ink">
                      {o.number} <span className="text-taupe">· {formatDate(o.createdAt)}</span>
                    </p>
                    <p className="truncate text-[14.5px] text-taupe">
                      {o.items[0]?.name}
                      {o.items.length > 1 ? ` + ${pluralize(o.items.length - 1, 'more piece')}` : ''}
                    </p>
                  </div>
                  <StatusBadge status={o.status} />
                  <p className="w-24 text-right text-[16px] tabular-nums">{formatMoney(o.total, { exact: true })}</p>
                  <ArrowRight className="hidden h-4 w-4 text-stone transition-colors group-hover:text-ink sm:block" strokeWidth={1.25} aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="border border-line px-6 py-10 text-center">
            <p className="font-serif text-2xl">No orders yet</p>
            <p className="mt-2 text-sm text-taupe">When you place an order, you’ll be able to follow it from the workshop to your door here.</p>
            <ButtonLink href="/collections/all" variant="outline" className="mt-6">
              Start Exploring
            </ButtonLink>
          </div>
        )}
      </section>

      <section aria-labelledby="quick-title">
        <h2 id="quick-title" className="sr-only">
          Quick links
        </h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          {quick.map((q) => (
            <li key={q.href}>
              <Link href={q.href} className="group flex h-full flex-col border border-line p-5 transition-colors hover:border-ink">
                <q.icon className="h-5 w-5 text-gold" strokeWidth={1.1} aria-hidden />
                <span className="mt-4 text-[16px] text-ink">{q.label}</span>
                <span className="mt-1 text-[14px] leading-snug text-taupe">{q.text}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="profile-title" className="border-t border-line pt-10">
        <h2 id="profile-title" className="font-serif text-3xl font-light">
          Your details
        </h2>
        <p className="mb-6 mt-1 text-sm text-taupe">Used to personalise your account.</p>
        <ProfileForm initial={{ name: user.name ?? '', email: user.email, phone: user.phone ?? '' }} />
      </section>

      <section aria-labelledby="password-title" className="border-t border-line pt-10">
        <h2 id="password-title" className="font-serif text-3xl font-light">
          {user.passwordHash ? 'Change password' : 'Set a password'}
        </h2>
        <p className="mb-6 mt-1 text-sm text-taupe">{user.passwordHash ? 'Choose something memorable that you don’t use elsewhere.' : 'Add a password to sign in with your email as well.'}</p>
        <PasswordForm hasPassword={!!user.passwordHash} email={user.email} />
      </section>
    </div>
  );
}
