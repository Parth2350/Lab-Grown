// Shared settings for the local QA scripts (npm run qa). Runs ONLY against a local dev server.
import { existsSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..').split(path.sep).join('/') + '/';
export const TMP = path.join(os.tmpdir(), 'tvj-qa').split(path.sep).join('/');
mkdirSync(TMP, { recursive: true });

export const BASE = (process.env.QA_BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
if (!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(BASE)) {
  console.error(`QA scripts only run against a local dev server, not ${BASE}.`);
  process.exit(1);
}

export const projectRequire = createRequire(ROOT + 'package.json');

/** A camera-sized (4000×3000, ~5 MB) JPEG used to test uploads above Vercel's 4.5 MB request limit. */
export async function bigPhoto() {
  const file = TMP + '/photo_4000.jpg';
  if (existsSync(file)) return file;
  const sharp = projectRequire('sharp');
  const width = 4000;
  const height = 3000;
  const px = Buffer.alloc(width * height * 3);
  for (let i = 0; i < px.length; i += 3) {
    const x = (i / 3) % width;
    const y = Math.floor(i / 3 / width);
    const n = (Math.random() - 0.5) * 60;
    px[i] = Math.max(0, Math.min(255, 200 - (x / width) * 80 + n));
    px[i + 1] = Math.max(0, Math.min(255, 180 - (y / height) * 70 + n));
    px[i + 2] = Math.max(0, Math.min(255, 140 + n));
  }
  await sharp(px, { raw: { width, height, channels: 3 } }).jpeg({ quality: 95 }).toFile(file);
  return file;
}
