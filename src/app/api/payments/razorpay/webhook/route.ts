import { NextResponse } from 'next/server';
import { finalizeFromWebhook, verifyRazorpayWebhook } from '@/lib/server/orders';

export const dynamic = 'force-dynamic';

type WebhookEvent = {
  event?: string;
  payload?: {
    payment?: { entity?: { id?: string; order_id?: string; amount?: number; currency?: string; method?: string; status?: string } };
    order?: { entity?: { id?: string } };
  };
};

/**
 * Razorpay webhook (configure in the Razorpay dashboard with events payment.captured
 * and order.paid, and set RAZORPAY_WEBHOOK_SECRET). Signature-verified; idempotent.
 */
export async function POST(req: Request) {
  if (!process.env.RAZORPAY_WEBHOOK_SECRET) return NextResponse.json({ error: 'Webhook not configured' }, { status: 404 });
  const raw = await req.text();
  if (!verifyRazorpayWebhook(raw, req.headers.get('x-razorpay-signature'))) return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });

  let evt: WebhookEvent;
  try {
    evt = JSON.parse(raw) as WebhookEvent;
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
  if (evt.event !== 'payment.captured' && evt.event !== 'order.paid') return NextResponse.json({ ok: true, ignored: evt.event ?? null });

  const payment = evt.payload?.payment?.entity ?? {};
  try {
    const result = await finalizeFromWebhook({ ...payment, order_id: payment.order_id ?? evt.payload?.order?.entity?.id });
    // Always 200 for verified events we can't act on, so Razorpay doesn't retry forever.
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error('[razorpay webhook]', e);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}
