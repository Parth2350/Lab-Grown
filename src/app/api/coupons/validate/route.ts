import { NextResponse } from 'next/server';
import { z } from 'zod';
import { clientIp, errorResponse, rateLimit, readJson, tooMany, validateCoupon } from '@/lib/server/orders';

export const dynamic = 'force-dynamic';

const schema = z.object({
  code: z.string().trim().min(1, 'Enter a code').max(40),
  subtotal: z.number().int().min(0).max(1_000_000_000),
});

/** { code, subtotal } → { ok, discount, message, code }. Never exposes coupon internals. */
export async function POST(req: Request) {
  try {
    const limit = rateLimit(`coupon:${clientIp(req)}`, 25, 60_000);
    if (!limit.ok) return tooMany(limit.retryAfter);
    const parsed = schema.safeParse(await readJson(req));
    if (!parsed.success) return NextResponse.json({ ok: false, discount: 0, message: 'Enter a valid code', code: '' }, { status: 400 });
    const r = await validateCoupon(parsed.data.code, parsed.data.subtotal);
    return NextResponse.json(r, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    return errorResponse(e);
  }
}
