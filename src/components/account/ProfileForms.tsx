'use client';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AlertCircle, Check } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/commerce/FormField';
import { changePasswordSchema, fieldErrors, profileSchema } from '@/components/commerce/schemas';
import { PasswordInput } from './PasswordInput';

function Status({ ok, error }: { ok?: string | null; error?: string | null }) {
  return (
    <p className="min-h-[1.25rem] text-[15px]" role="status" aria-live="polite">
      {error ? (
        <span className="flex items-center gap-1.5 text-danger">
          <AlertCircle className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden /> {error}
        </span>
      ) : ok ? (
        <span className="flex items-center gap-1.5 text-success">
          <Check className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden /> {ok}
        </span>
      ) : null}
    </p>
  );
}

export function ProfileForm({ initial }: { initial: { name: string; email: string; phone: string } }) {
  const router = useRouter();
  const { update } = useSession();
  const [form, setForm] = useState({ name: initial.name, phone: initial.phone });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const dirty = form.name !== initial.name || form.phone !== initial.phone;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setOk(null);
    setError(null);
    const parsed = profileSchema.safeParse(form);
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setBusy(true);
    try {
      const res = await fetch('/api/account/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(parsed.data) });
      const json = (await res.json().catch(() => ({}))) as { error?: string; fieldErrors?: Record<string, string> };
      if (!res.ok) {
        setErrors(json.fieldErrors ?? {});
        setError(json.error ?? 'We couldn’t save your details.');
        return;
      }
      await update({ name: parsed.data.name });
      setOk('Your details have been saved');
      router.refresh();
    } catch {
      setError('We couldn’t reach our servers. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="grid gap-5 sm:grid-cols-2">
      <FormField
        id="profile-name"
        label="Full name"
        autoComplete="name"
        required
        maxLength={80}
        value={form.name}
        onChange={(e) => {
          setForm((f) => ({ ...f, name: e.target.value }));
          setErrors((x) => ({ ...x, name: '' }));
        }}
        error={errors.name || undefined}
      />
      <FormField
        id="profile-phone"
        label="Phone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        maxLength={24}
        value={form.phone}
        onChange={(e) => {
          setForm((f) => ({ ...f, phone: e.target.value }));
          setErrors((x) => ({ ...x, phone: '' }));
        }}
        error={errors.phone || undefined}
        hint="Optional — helps us coordinate insured deliveries"
      />
      <FormField id="profile-email" label="Email" value={initial.email} readOnly disabled className="sm:col-span-2" hint="Contact our concierge to change the email on your account" inputClassName="bg-porcelain text-taupe" />
      <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
        <Button type="submit" loading={busy} disabled={!dirty || busy}>
          Save details
        </Button>
        <Status ok={ok} error={error} />
      </div>
    </form>
  );
}

export function PasswordForm({ hasPassword, email }: { hasPassword: boolean; email: string }) {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((x) => ({ ...x, [k]: '' }));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setOk(null);
    setError(null);
    const errs: Record<string, string> = {};
    if (hasPassword && !form.currentPassword) errs.currentPassword = 'Enter your current password';
    const parsed = changePasswordSchema.safeParse({ currentPassword: form.currentPassword, newPassword: form.newPassword });
    if (!parsed.success) Object.assign(errs, fieldErrors(parsed.error));
    if (form.newPassword && form.confirm !== form.newPassword) errs.confirm = 'Passwords don’t match';
    setErrors(errs);
    if (Object.values(errs).some(Boolean)) return;
    setBusy(true);
    try {
      const res = await fetch('/api/account/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string; fieldErrors?: Record<string, string> };
      if (!res.ok) {
        setErrors(json.fieldErrors ?? {});
        setError(json.error ?? 'We couldn’t update your password.');
        return;
      }
      setForm({ currentPassword: '', newPassword: '', confirm: '' });
      setOk('Password updated');
    } catch {
      setError('We couldn’t reach our servers. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="grid gap-5 sm:grid-cols-2">
      {/* Helps password managers associate the change with the account */}
      <input type="email" name="username" autoComplete="username" value={email} hidden readOnly />
      {hasPassword && (
        <PasswordInput
          id="pw-current"
          label="Current password"
          autoComplete="current-password"
          className="sm:col-span-2"
          value={form.currentPassword}
          onChange={set('currentPassword')}
          error={errors.currentPassword || undefined}
        />
      )}
      <PasswordInput id="pw-new" label="New password" autoComplete="new-password" hint="8+ characters with a letter and a number" value={form.newPassword} onChange={set('newPassword')} error={errors.newPassword || undefined} />
      <PasswordInput id="pw-confirm" label="Confirm new password" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} error={errors.confirm || undefined} />
      <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
        <Button type="submit" variant="outline" loading={busy}>
          {hasPassword ? 'Update password' : 'Set password'}
        </Button>
        <Status ok={ok} error={error} />
      </div>
    </form>
  );
}
