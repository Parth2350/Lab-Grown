'use client';
import { useEffect } from 'react';
import { Button, ButtonLink } from '@/components/ui/Button';

export default function StoreError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <section className="container-x py-24 text-center">
      <p className="eyebrow mb-4">Something went wrong</p>
      <h1 className="h-section">We could not load this page</h1>
      <p className="mx-auto mt-4 max-w-md text-taupe">Please try again in a moment. If the problem continues, our concierge team is happy to help.</p>
      <div className="mt-8 flex justify-center gap-3">
        <Button onClick={reset}>Try again</Button>
        <ButtonLink href="/contact" variant="outline">
          Contact us
        </ButtonLink>
      </div>
    </section>
  );
}
