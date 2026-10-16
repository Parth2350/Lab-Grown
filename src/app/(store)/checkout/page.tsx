import { redirect } from 'next/navigation';

// Orders are placed over WhatsApp from the bag, so the online checkout is switched off.
// (CheckoutView and /api/checkout are kept so it can be switched back on.)
export default function CheckoutPage() {
  redirect('/cart');
}
