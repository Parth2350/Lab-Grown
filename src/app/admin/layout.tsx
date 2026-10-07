import type { Metadata } from 'next';
import { site } from '@/config/site';
import { requireAdmin } from '@/lib/server/auth';
import { getNavCounts } from '@/lib/server/admin/nav';
import { AdminShell } from '@/components/admin/shell/AdminShell';
import { AdminToaster } from '@/components/admin/toast';

export const metadata: Metadata = {
  title: { default: `Admin · ${site.name}`, template: `%s · ${site.name} Admin` },
  robots: { index: false, follow: false, nocache: true },
};

// Admin data must always be fresh.
export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  const counts = await getNavCounts();
  return (
    <>
      <AdminShell user={{ name: user.name, email: user.email }} counts={counts}>
        {children}
      </AdminShell>
      <AdminToaster />
    </>
  );
}
