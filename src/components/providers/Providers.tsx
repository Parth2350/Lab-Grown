'use client';
import { SessionProvider } from 'next-auth/react';
import { LazyMotion, MotionConfig } from 'framer-motion';
import type { ReactNode } from 'react';

// Animation features are code-split and fetched after hydration; `m` components render
// immediately and start animating once they arrive. `strict` flags any stray `motion.*`.
const loadFeatures = () => import('@/lib/motion-features').then((mod) => mod.default);

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus={false}>
      <LazyMotion features={loadFeatures} strict>
        <MotionConfig reducedMotion="user">{children}</MotionConfig>
      </LazyMotion>
    </SessionProvider>
  );
}
