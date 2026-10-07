import { pageMeta } from '@/lib/seo';
import { requireUser } from '@/lib/server/auth';
import { db } from '@/lib/server/db';
import { AddressBook } from '@/components/account/AddressBook';

export const metadata = pageMeta({ title: 'Addresses', description: 'Manage your saved delivery addresses.', path: '/account/addresses', noIndex: true });

export default async function AddressesPage() {
  const user = await requireUser('/account/addresses');
  const rows = await db.address.findMany({ where: { userId: user.id }, orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }] });
  return (
    <AddressBook
      key={rows.map((r) => `${r.id}:${r.isDefault}`).join(',')}
      initial={rows.map((r) => ({
        id: r.id,
        isDefault: r.isDefault,
        label: r.label ?? '',
        firstName: r.firstName,
        lastName: r.lastName,
        phone: r.phone,
        line1: r.line1,
        line2: r.line2 ?? '',
        city: r.city,
        state: r.state,
        postalCode: r.postalCode,
        country: r.country,
      }))}
    />
  );
}
