'use client';
import { ArrowRight, Check } from 'lucide-react';
import { useState } from 'react';

export function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setState('loading');
        const res = await fetch('/api/newsletter', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) }).catch(() => null);
        if (res?.ok) {
          setState('done');
          setMsg('Thank you — you are on the list.');
          setEmail('');
        } else {
          setState('error');
          setMsg('Please enter a valid email address.');
        }
      }}
      className="relative"
    >
      <label htmlFor="newsletter-email" className="sr-only">
        Email address
      </label>
      <input
        id="newsletter-email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email address"
        className="h-12 w-full border-b border-white/30 bg-transparent pr-12 text-[16px] text-ivory placeholder:text-ivory/40 focus:border-gold-light focus:outline-none"
      />
      <button type="submit" disabled={state === 'loading'} aria-label="Subscribe" className="absolute right-0 top-0 flex h-12 w-12 items-center justify-center text-ivory transition-colors hover:text-gold-light">
        {state === 'done' ? <Check className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" strokeWidth={1.5} />}
      </button>
      {msg && (
        <p className={`mt-2 text-[14px] ${state === 'error' ? 'text-red-300' : 'text-gold-light'}`} role="status">
          {msg}
        </p>
      )}
    </form>
  );
}
