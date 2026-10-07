import { pageMeta } from '@/lib/seo';
import { getSession } from '@/lib/server/auth';
import { db } from '@/lib/server/db';
import { razorpayConfigured } from '@/lib/server/orders';
import { CheckoutView, type SavedAddress } from '@/components/checkout/CheckoutView';

export const metadata = pageMeta({
  title: 'Secure Checkout',
  description: 'Complete your order securely — insured delivery, certified diamonds and easy returns.',
  path: '/checkout',
  noIndex: true,
});

export const dynamic = 'force-dynamic';

export default async function CheckoutPage() {
  const session = await getSession();
  let user: { name: string | null; email: string; phone: string | null } | null = null;
  let addresses: SavedAddress[] = [];
  if (session?.user?.id) {
    const row = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        email: true,
        phone: true,
        addresses: {
          orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
          select: { id: true, label: true, firstName: true, lastName: true, phone: true, line1: true, line2: true, city: true, state: true, postalCode: true, country: true, isDefault: true },
        },
      },
    });
    if (row) {
      user = { name: row.name, email: row.email, phone: row.phone };
      addresses = row.addresses;
    }
  }
  return <CheckoutView user={user} addresses={addresses} paymentMode={razorpayConfigured() ? 'razorpay' : 'demo'} />;
}
