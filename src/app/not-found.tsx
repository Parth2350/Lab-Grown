import Link from 'next/link';
import { site } from '@/config/site';

export default function RootNotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-ivory px-6 text-center">
      <Link href="/" className="font-serif text-3xl uppercase tracking-[0.3em]">
        {site.name}
      </Link>
      <p className="eyebrow mb-3 mt-16">Error 404</p>
      <h1 className="h-section">This page has gone missing</h1>
      <p className="mt-4 max-w-md text-taupe">The page you were looking for may have moved. Let us guide you back.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="label-caps flex h-12 items-center bg-ink px-7 text-ivory">
          Return home
        </Link>
        <Link href="/collections/all" className="label-caps flex h-12 items-center border border-ink px-7">
          Shop all jewelry
        </Link>
      </div>
    </main>
  );
}
