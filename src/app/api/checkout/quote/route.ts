import { NextResponse } from 'next/server';
import { quoteSchema } from '@/components/commerce/schemas';
import { clientIp, errorResponse, quote, rateLimit, readJson, tooMany } from '@/lib/server/orders';

export const dynamic = 'force-dynamic';

/** Authoritative live pricing for the bag/checkout summary (prices, stock, coupon, taxes). */
export async function POST(req: Request) {
  try {
    const limit = rateLimit(`quote:${clientIp(req)}`, 90, 60_000);
    if (!limit.ok) return tooMany(limit.retryAfter);
    const parsed = quoteSchema.safeParse(await readJson(req));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    return NextResponse.json(await quote(parsed.data), { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    return errorResponse(e);
  }
}
