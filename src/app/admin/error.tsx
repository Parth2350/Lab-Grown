'use client';
import { useEffect } from 'react';
import { TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="flex flex-col items-center border border-line bg-white px-6 py-16 text-center" role="alert">
      <TriangleAlert className="mb-3 h-7 w-7 text-danger" strokeWidth={1.25} aria-hidden />
      <h1 className="font-serif text-2xl">This page could not be loaded</h1>
      <p className="mt-2 max-w-md text-[13px] text-taupe">
        Something went wrong while loading this admin page. Your data is safe — try again, and if the problem continues check the server logs
        {error.digest ? ` (reference ${error.digest})` : ''}.
      </p>
      <Button size="sm" className="mt-6" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
