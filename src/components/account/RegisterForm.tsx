'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { AlertCircle, Check, Package } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { site } from '@/config/site';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/commerce/FormField';
import { fieldErrors, registerSchema } from '@/components/commerce/schemas';
import { LAST_ORDER_KEY } from '@/components/checkout/constants';
import { PasswordInput } from './PasswordInput';

export function RegisterForm({ callbackUrl, claim }: { callbackUrl: string; claim: string | null }) {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [exists, setExists] = useState(false);
  const [busy, setBusy] = useState(false);
  const [claimToken, setClaimToken] = useState<string | null>(null);

  useEffect(() => {
    if (!claim) return;
    try {
      const saved = JSON.parse(sessionStorage.getItem(LAST_ORDER_KEY) ?? 'null') as { number?: string; token?: string } | null;
      if (saved?.number === claim && saved.token) setClaimToken(saved.token);
    } catch {
      /* storage unavailable */
    }
  }, [claim]);

  const rules = [
    { ok: form.password.length >= 8, text: 'At least 8 characters' },
    { ok: /\d/.test(form.password), text: 'A number' },
    { ok: /[A-Za-z]/.test(form.password), text: 'A letter' },
  ];

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((x) => {
      const { [k]: _omit, ...rest } = x;
      return rest;
    });
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setExists(false);
    const parsed = registerSchema.safeParse(form);
    if (!parsed.success) {
      const errs = fieldErrors(parsed.error);
      setErrors(errs);
      const first = ['name', 'email', 'password'].find((k) => errs[k]);
      if (first) document.getElementById(`register-${first}`)?.focus();
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...parsed.data, claim: claim && claimToken ? { orderNumber: claim, token: claimToken } : null }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string; fieldErrors?: Record<string, string> };
      if (!res.ok) {
        setError(json.error ?? 'We couldn’t create your account. Please try again.');
        if (json.fieldErrors) setErrors(json.fieldErrors);
        if (res.status === 409) setExists(true);
        setBusy(false);
        return;
      }
      const signed = await signIn('credentials', { email: parsed.data.email, password: parsed.data.password, redirect: false });
      if (!signed || signed.error) {
        router.replace(`/account/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
        return;
      }
      router.replace(callbackUrl);
      router.refresh();
    } catch {
      setError('We couldn’t reach our servers. Please check your connection and try again.');
      setBusy(false);
    }
  };

  return (
    <div>
      <p className="eyebrow">Join {site.name}</p>
      <h1 className="mt-3 font-serif text-4xl font-light sm:text-5xl">Create an account</h1>
      <p className="mt-3 text-[17px] text-taupe">Track every order and keep your wishlist across devices.</p>

      {claim && (
        <p className="mt-6 flex items-start gap-3 bg-porcelain px-4 py-3 text-[15px] text-charcoal">
          <Package className="mt-0.5 h-4 w-4 shrink-0 text-gold" strokeWidth={1.25} aria-hidden />
          {claimToken ? `Order ${claim} will be saved to your new account.` : `Create your account to track future orders. (Order ${claim} can be linked by our concierge.)`}
        </p>
      )}

      <form onSubmit={submit} noValidate className="mt-8 space-y-5">
        <FormField id="register-name" label="Full name" autoComplete="name" required maxLength={80} value={form.name} onChange={set('name')} error={errors.name} />
        <FormField
          id="register-email"
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          required
          maxLength={160}
          value={form.email}
          onChange={set('email')}
          error={errors.email}
        />
        <div>
          <PasswordInput id="register-password" label="Password" autoComplete="new-password" required value={form.password} onChange={set('password')} error={errors.password} />
          <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1" aria-label="Password requirements">
            {rules.map((r) => (
              <li key={r.text} className={cn('flex items-center gap-1.5 text-[14px] transition-colors', r.ok ? 'text-success' : 'text-taupe')}>
                <Check className={cn('h-3 w-3', r.ok ? 'opacity-100' : 'opacity-30')} strokeWidth={2} aria-hidden />
                {r.text}
                <span className="sr-only">{r.ok ? '(met)' : '(not yet met)'}</span>
              </li>
            ))}
          </ul>
        </div>
        <div aria-live="assertive">
          {error && (
            <p className="flex items-start gap-2 border border-danger/30 bg-danger/5 px-4 py-3 text-[15px] text-danger">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden />
              <span>
                {error}{' '}
                {exists && (
                  <Link href={`/account/login?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="text-ink underline underline-offset-2">
                    Sign in
                  </Link>
                )}
              </span>
            </p>
          )}
        </div>
        <Button type="submit" size="lg" className="w-full" loading={busy}>
          Create Account
        </Button>
        <p className="text-center text-[14px] leading-relaxed text-taupe">
          By creating an account you agree to our{' '}
          <Link href="/pages/terms" className="underline underline-offset-2 hover:text-ink">
            Terms
          </Link>{' '}
          and{' '}
          <Link href="/pages/privacy-policy" className="underline underline-offset-2 hover:text-ink">
            Privacy Policy
          </Link>
          .
        </p>
      </form>

      <p className="mt-8 border-t border-line pt-6 text-center text-[16px] text-taupe">
        Already have an account?{' '}
        <Link href={`/account/login${callbackUrl !== '/account' ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ''}`} className="text-ink underline underline-offset-4 hover:text-gold-deep">
          Sign in
        </Link>
      </p>
    </div>
  );
}
