'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn, signOut } from 'next-auth/react';
import { AlertCircle, KeyRound, ShieldAlert } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { site } from '@/config/site';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/commerce/FormField';
import { emailSchema } from '@/components/commerce/schemas';
import { PasswordInput } from './PasswordInput';

const DEMO = { email: 'demo@aurevia.example', password: 'Aurevia@Demo1' };
const showDemo = process.env.NEXT_PUBLIC_DEMO_MODE !== 'false';

export function LoginForm({ callbackUrl, adminNotice, signedInAs }: { callbackUrl: string; adminNotice?: boolean; signedInAs?: string | null }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsedEmail = emailSchema.safeParse(email);
    const errs = { email: parsedEmail.success ? undefined : parsedEmail.error.issues[0]?.message, password: password ? undefined : 'Enter your password' };
    setErrors(errs);
    if (errs.email || errs.password) {
      document.getElementById(errs.email ? 'login-email' : 'login-password')?.focus();
      return;
    }
    setBusy(true);
    try {
      const res = await signIn('credentials', { email: parsedEmail.data, password, redirect: false, callbackUrl });
      if (!res || res.error) {
        setError('That email and password don’t match our records. Please try again.');
        setBusy(false);
        return;
      }
      router.replace(callbackUrl);
      router.refresh();
    } catch {
      setError('We couldn’t sign you in just now. Please try again.');
      setBusy(false);
    }
  };

  return (
    <div>
      <p className="eyebrow">Your account</p>
      <h1 className="mt-3 font-serif text-4xl font-light sm:text-5xl">Welcome back</h1>
      <p className="mt-3 text-[15px] text-taupe">Sign in to track orders, revisit your wishlist and check out faster.</p>

      {adminNotice && (
        <div role="alert" className="mt-8 flex gap-3 border border-gold/40 bg-gold-pale/40 px-4 py-3 text-[13px] text-charcoal">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-gold-deep" strokeWidth={1.5} aria-hidden />
          <div>
            <p className="text-ink">The admin area is for {site.name} administrators.</p>
            <p className="mt-0.5 text-taupe">
              {signedInAs ? (
                <>
                  You’re signed in as {signedInAs}, which doesn’t have admin access.{' '}
                  <button type="button" onClick={() => signOut({ callbackUrl: `/account/login?callbackUrl=${encodeURIComponent(callbackUrl)}` })} className="text-ink underline underline-offset-2">
                    Switch account
                  </button>
                </>
              ) : (
                'Please sign in with an administrator account to continue.'
              )}
            </p>
          </div>
        </div>
      )}

      <form onSubmit={submit} noValidate className="mt-8 space-y-5" aria-describedby={error ? 'login-error' : undefined}>
        <FormField
          id="login-email"
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setErrors((x) => ({ ...x, email: undefined }));
          }}
          error={errors.email}
        />
        <PasswordInput
          id="login-password"
          label="Password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setErrors((x) => ({ ...x, password: undefined }));
          }}
          error={errors.password}
        />
        <div className="flex justify-end">
          <Link href="/contact?topic=account" className="text-[12.5px] text-taupe underline-offset-4 hover:text-ink hover:underline">
            Forgotten your password?
          </Link>
        </div>
        <div aria-live="assertive">
          {error && (
            <p id="login-error" className="flex items-start gap-2 border border-danger/30 bg-danger/5 px-4 py-3 text-[13px] text-danger">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden /> {error}
            </p>
          )}
        </div>
        <Button type="submit" size="lg" className="w-full" loading={busy}>
          Sign In
        </Button>
      </form>

      <p className="mt-8 border-t border-line pt-6 text-center text-[14px] text-taupe">
        New to {site.name}?{' '}
        <Link href={`/account/register${callbackUrl !== '/account' ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ''}`} className="text-ink underline underline-offset-4 hover:text-gold-deep">
          Create an account
        </Link>
      </p>

      {showDemo && (
        <div className="mt-8 border border-dashed border-stone bg-porcelain/60 px-5 py-4">
          <p className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-charcoal">
            <KeyRound className="h-3.5 w-3.5 text-gold" strokeWidth={1.5} aria-hidden /> Demo account
          </p>
          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-[13px]">
            <dt className="text-taupe">Email</dt>
            <dd className="select-all break-all text-ink">{DEMO.email}</dd>
            <dt className="text-taupe">Password</dt>
            <dd className="select-all text-ink">{DEMO.password}</dd>
          </dl>
          <button
            type="button"
            onClick={() => {
              setEmail(DEMO.email);
              setPassword(DEMO.password);
              setErrors({});
              setError(null);
            }}
            className="mt-3 text-[12px] uppercase tracking-[0.14em] text-ink underline underline-offset-4 hover:text-gold-deep"
          >
            Use demo account
          </button>
        </div>
      )}
    </div>
  );
}
