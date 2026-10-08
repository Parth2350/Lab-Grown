import { NextResponse } from 'next/server';
import { z } from 'zod';
import { clientIp, errorResponse, finalizeRazorpay, rateLimit, readJson, tooMany } from '@/lib/server/orders';

export const dynamic = 'force-dynamic';

const schema = z.object({
  orderNumber: z.string().trim().regex(/^[A-Z]{3}-\d{6}$/),
  razorpay_order_id: z.string().trim().min(1).max(64),
  razorpay_payment_id: z.string().trim().min(1).max(64),
  razorpay_signature: z.string().trim().min(1).max(256),
});

/** Verifies Razorpay's HMAC-SHA256 signature and finalizes the order (idempotent). */
export async function POST(req: Request) {
  try {
    const limit = rateLimit(`verify:${clientIp(req)}`, 20, 60_000);
    if (!limit.ok) return tooMany(limit.retryAfter);
    const parsed = schema.safeParse(await readJson(req));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid payment confirmation.' }, { status: 400 });
    const result = await finalizeRazorpay(parsed.data);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return errorResponse(e);
  }
}
