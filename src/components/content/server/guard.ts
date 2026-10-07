import 'server-only';
import { NextResponse } from 'next/server';
import type { ZodError } from 'zod';
import { firstErrors } from '@/components/content/forms/schemas';

/**
 * Small request guards for the public content-form endpoints.
 * The rate limiter is in-memory (per server instance) — adequate for a single node;
 * swap for a Redis-backed limiter when running several instances.
 */

type Bucket = { hits: number[] };
const store = ((globalThis as unknown as { __contentRateLimit?: Map<string, Bucket> }).__contentRateLimit ??= new Map<string, Bucket>());
let lastSweep = Date.now();

export function clientIp(req: Request) {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0]!.trim();
  return req.headers.get('x-real-ip') ?? req.headers.get('cf-connecting-ip') ?? 'local';
}

/** Sliding-window limiter. Returns seconds until a slot frees up when blocked. */
export function rateLimit(key: string, limit: number, windowMs: number): { ok: true } | { ok: false; retryAfter: number } {
  const now = Date.now();
  if (now - lastSweep > 60_000) {
    for (const [k, b] of store) if (!b.hits.length || now - b.hits[b.hits.length - 1]! > windowMs) store.delete(k);
    lastSweep = now;
  }
  const bucket = store.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((t) => now - t < windowMs);
  if (bucket.hits.length >= limit) {
    store.set(key, bucket);
    return { ok: false, retryAfter: Math.max(1, Math.ceil((windowMs - (now - bucket.hits[0]!)) / 1000)) };
  }
  bucket.hits.push(now);
  store.set(key, bucket);
  return { ok: true };
}

export function tooManyRequests(retryAfter: number) {
  return NextResponse.json(
    { error: 'You have sent several requests in a short time. Please wait a few minutes and try again.' },
    { status: 429, headers: { 'Retry-After': String(retryAfter) } },
  );
}

export function validationError(error: ZodError, message = 'Please check the highlighted fields and try again.') {
  return NextResponse.json({ error: message, fieldErrors: firstErrors(error) }, { status: 400 });
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message, fieldErrors: {} }, { status: 400 });
}

export function serverError(message = 'We could not save your details just now. Please try again in a moment.') {
  return NextResponse.json({ error: message }, { status: 500 });
}

/** Parse a JSON body without throwing; rejects oversized payloads. */
export async function readJson(req: Request, maxBytes = 64 * 1024): Promise<Record<string, unknown> | null> {
  const len = Number(req.headers.get('content-length') ?? 0);
  if (len > maxBytes) return null;
  try {
    const text = await req.text();
    if (text.length > maxBytes) return null;
    const json = JSON.parse(text) as unknown;
    return json && typeof json === 'object' && !Array.isArray(json) ? (json as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** True when the hidden honeypot field was filled in (almost certainly a bot). */
export function isBot(body: Record<string, unknown>) {
  return typeof body._hp === 'string' && body._hp.length > 0;
}
