'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Renders children only once the wrapper approaches the viewport — the SVG equivalent
 * of `loading="lazy"`. `eager` content (above the fold / LCP) renders on the server.
 */
export function LazyMount({
  children,
  eager = false,
  className,
  rootMargin = '400px',
  fallback = null,
}: {
  children: ReactNode;
  eager?: boolean;
  className?: string;
  rootMargin?: string;
  /** Placeholder rendered until mounted — size it like the content to avoid layout shift */
  fallback?: ReactNode;
}) {
  const [show, setShow] = useState(eager);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (show || !ref.current) return;
    if (!('IntersectionObserver' in window)) {
      setShow(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShow(true);
          io.disconnect();
        }
      },
      { rootMargin },
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [show, rootMargin]);

  return (
    <span ref={ref} className={className}>
      {show ? children : fallback}
    </span>
  );
}
