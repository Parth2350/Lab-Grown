import { requireUser } from '@/lib/server/auth';
import { AccountNav } from '@/components/account/AccountNav';

/** Signed-in customer area: greeting, navigation (sidebar / mobile tabs) and page content. */
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser('/account');
  const first = user.name?.trim().split(/\s+/)[0] || 'there';
  return (
    <div className="container-x pb-24 pt-8 lg:pt-12">
      <header className="flex flex-wrap items-end justify-between gap-4 pb-6 lg:border-b lg:border-line">
        <div>
          <p className="eyebrow">My account</p>
          <h1 className="mt-2 font-serif text-4xl font-light sm:text-5xl">Hello, {first}</h1>
        </div>
        <p className="hidden text-[13px] text-taupe sm:block">{user.email}</p>
      </header>
      <div className="lg:mt-12 lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-16 xl:gap-20">
        <AccountNav isAdmin={user.role === 'ADMIN'} />
        <div className="min-w-0 pt-8 lg:pt-0">{children}</div>
      </div>
    </div>
  );
}
