import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { assertAdmin } from '@/lib/server/auth';

export const dynamic = 'force-dynamic';

/**
 * Issues one-off tokens so the admin's browser can upload large files (the hero video) straight to
 * Vercel Blob — server requests are capped at 4.5 MB on Vercel, videos are bigger. Admins only.
 */
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        await assertAdmin();
        if (!pathname.startsWith('uploads/hero/')) throw new Error('Unexpected upload path');
        return { allowedContentTypes: ['video/mp4', 'video/webm'], maximumSizeInBytes: 100 * 1024 * 1024, addRandomSuffix: true };
      },
    });
    return NextResponse.json(json);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Upload failed' }, { status: 400 });
  }
}
