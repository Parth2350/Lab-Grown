'use client';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

/** A coupon code with a copy button */
export function CopyCode({ code, className }: { code: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked — the code stays visible to copy by hand
    }
  };
  return (
    <div className={cn('flex items-stretch justify-center', className)}>
      <span className="flex items-center border border-dashed border-gold px-5 font-mono text-lg tracking-[0.12em] text-ink">{code}</span>
      <button type="button" onClick={() => void copy()} className="label-caps flex items-center gap-2 bg-gold px-4 py-3 text-ink transition-colors hover:bg-gold-light" aria-live="polite">
        {copied ? <Check className="h-4 w-4" strokeWidth={1.5} aria-hidden /> : <Copy className="h-4 w-4" strokeWidth={1.5} aria-hidden />}
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}
