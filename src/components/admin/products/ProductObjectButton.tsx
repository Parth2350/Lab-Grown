'use client';
import { Braces, Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { Sheet } from '@/components/ui/Sheet';

/** Opens the product in the partner catalogue's object shape (read-only JSON, copyable). */
export function ProductObjectButton({ object, name }: { object: unknown; name: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const json = JSON.stringify(object, null, 4);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1 text-xs text-taupe underline-offset-4 hover:text-ink hover:underline">
        <Braces className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden /> Product object
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title={name} label={`${name} — product object`} className="sm:max-w-[720px]" bodyClassName="px-5 py-5 sm:px-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-xs text-taupe">The product as the partner catalogue describes it (prices in ₹).</p>
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(json);
                setCopied(true);
                setTimeout(() => setCopied(false), 1600);
              } catch {
                /* clipboard blocked */
              }
            }}
            className="inline-flex shrink-0 items-center gap-1.5 border border-line px-3 py-1.5 text-xs text-ink hover:border-ink"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-success" strokeWidth={2} aria-hidden /> : <Copy className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />}
            {copied ? 'Copied' : 'Copy JSON'}
          </button>
        </div>
        <pre className="overflow-x-auto whitespace-pre border border-line bg-[#FBFAF7] p-4 font-mono text-[12.5px] leading-relaxed text-charcoal">{json}</pre>
      </Sheet>
    </>
  );
}
