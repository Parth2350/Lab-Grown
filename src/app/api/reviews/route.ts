import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/server/db';
import { getSession } from '@/lib/server/auth';

const schema = z.object({
  productId: z.string().min(1).max(40),
  rating: z.number().int().min(1).max(5),
  authorName: z.string().trim().min(2, 'Please enter your name').max(60),
  location: z.string().trim().max(60).optional().nullable(),
  title: z.string().trim().min(3, 'Please add a short title').max(120),
  body: z.string().trim().min(10, 'Please write at least a sentence').max(2000),
});

const hits = new Map<string, number[]>();

/** Customer review submission — stored as PENDING until approved in the admin. */
export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60 * 60 * 1000);
  if (recent.length >= 5) return NextResponse.json({ error: 'Too many reviews submitted. Please try again later.' }, { status: 429 });

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    const fieldErrors = Object.fromEntries(Object.entries(parsed.error.flatten().fieldErrors).map(([k, v]) => [k, v?.[0] ?? 'Invalid']));
    return NextResponse.json({ error: 'Please check the highlighted fields.', fieldErrors }, { status: 400 });
  }
  const product = await db.product.findUnique({ where: { id: parsed.data.productId }, select: { id: true, isActive: true } });
  if (!product?.isActive) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

  const session = await getSession();
  let isVerified = false;
  if (session?.user?.id) {
    const bought = await db.orderItem.findFirst({
      where: { productId: product.id, order: { userId: session.user.id, status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] } } },
      select: { id: true },
    });
    isVerified = !!bought;
  }
  await db.review.create({
    data: { ...parsed.data, location: parsed.data.location || null, userId: session?.user?.id ?? null, isVerified, status: 'PENDING' },
  });
  hits.set(ip, [...recent, now]);
  return NextResponse.json({ ok: true }, { status: 201 });
}
