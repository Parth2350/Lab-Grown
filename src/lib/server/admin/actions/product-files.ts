import 'server-only';
import fs from 'node:fs/promises';
import path from 'node:path';
import { db } from '@/lib/server/db';

const UPLOAD_ROOT = path.resolve(process.cwd(), 'public', 'uploads');

/** `/uploads/products/x.jpg` → absolute path inside public/uploads, or null if it would escape it. */
function localUploadPath(url: string): string | null {
  if (!url.startsWith('/uploads/')) return null;
  let rel: string;
  try {
    rel = decodeURIComponent(url.split(/[?#]/)[0]).replace(/^\/+/, '');
  } catch {
    return null;
  }
  if (rel.includes('\0')) return null;
  const target = path.resolve(process.cwd(), 'public', rel);
  return target.startsWith(UPLOAD_ROOT + path.sep) ? target : null;
}

/**
 * Removes locally stored uploads (public/uploads/…) that no product media row references
 * any more. Remote URLs (Cloudinary/S3) are left alone. Never throws.
 */
export async function removeLocalUploads(urls: string[]) {
  const local = [...new Set(urls.filter((u) => u.startsWith('/uploads/')))];
  if (!local.length) return;
  try {
    const stillUsed = await db.productImage.findMany({ where: { url: { in: local } }, select: { url: true } });
    const used = new Set(stillUsed.map((r) => r.url));
    await Promise.all(
      local
        .filter((u) => !used.has(u))
        .map(async (url) => {
          const target = localUploadPath(url);
          if (!target) return;
          await fs.unlink(target).catch(() => undefined);
        }),
    );
  } catch {
    // Orphaned files are harmless; never fail the admin action over cleanup.
  }
}
