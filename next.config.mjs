import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  outputFileTracingRoot: root,
  // lets a production build run alongside `next dev` (e.g. NEXT_DIST_DIR=.next-prod)
  distDir: process.env.NEXT_DIST_DIR || '.next',
  eslint: { ignoreDuringBuilds: true },
  // render metadata in <head> for every client (not only known bots) — SEO tools audit the head
  htmlLimitedBots: /.*/,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: '**.amazonaws.com' },
      { protocol: 'https', hostname: '**.r2.cloudflarestorage.com' },
      { protocol: 'https', hostname: '**.public.blob.vercel-storage.com' },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
    serverActions: { bodySizeLimit: '10mb' },
  },
  async redirects() {
    return [
      { source: '/collections/gifts-under-250', destination: '/collections/gifts-under-25000', permanent: true },
      { source: '/collections/gifts-under-500', destination: '/collections/gifts-under-50000', permanent: true },
      { source: '/collections/gifts-under-1000', destination: '/collections/gifts-under-100000', permanent: true },
      // the store's old address forwards to its own, keeping the page and query
      { source: '/:path*', has: [{ type: 'host', value: 'lab-grown-pi.vercel.app' }], destination: 'https://thevjewels.vercel.app/:path*', permanent: true },
    ];
  },
  async headers() {
    return [
      { source: '/fonts/:file*', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
