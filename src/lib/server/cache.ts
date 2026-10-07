import 'server-only';
import type Redis from 'ioredis';

/**
 * Tiny cache-aside helper. Uses Redis when REDIS_URL is configured, otherwise an
 * in-process LRU-ish Map (fine for a single server / development).
 */
type Entry = { value: unknown; expires: number };
const memory = new Map<string, Entry>();
const MAX_MEMORY_KEYS = 500;

let redisPromise: Promise<Redis | null> | null = null;
function getRedis() {
  if (!process.env.REDIS_URL) return Promise.resolve(null);
  if (!redisPromise) {
    redisPromise = import('ioredis')
      .then(({ default: IORedis }) => {
        const client = new IORedis(process.env.REDIS_URL!, { maxRetriesPerRequest: 1, lazyConnect: false });
        client.on('error', () => {});
        return client;
      })
      .catch(() => null);
  }
  return redisPromise;
}

export async function remember<T>(key: string, ttlSeconds: number, fn: () => Promise<T>): Promise<T> {
  const redis = await getRedis();
  if (redis) {
    try {
      const hit = await redis.get(`aur:${key}`);
      if (hit) return JSON.parse(hit) as T;
      const value = await fn();
      await redis.set(`aur:${key}`, JSON.stringify(value), 'EX', ttlSeconds);
      return value;
    } catch {
      return fn();
    }
  }
  const now = Date.now();
  const hit = memory.get(key);
  if (hit && hit.expires > now) return hit.value as T;
  const value = await fn();
  if (memory.size >= MAX_MEMORY_KEYS) memory.delete(memory.keys().next().value as string);
  memory.set(key, { value, expires: now + ttlSeconds * 1000 });
  return value;
}

/** Remove every cached key starting with `prefix` */
export async function forget(prefix: string) {
  for (const k of [...memory.keys()]) if (k.startsWith(prefix)) memory.delete(k);
  const redis = await getRedis();
  if (!redis) return;
  try {
    let cursor = '0';
    do {
      const [next, keys] = await redis.scan(cursor, 'MATCH', `aur:${prefix}*`, 'COUNT', 200);
      cursor = next;
      if (keys.length) await redis.del(...keys);
    } while (cursor !== '0');
  } catch {
    /* ignore */
  }
}
