'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, m } from 'framer-motion';
import { AlertCircle, ArrowLeft, Check, ChevronDown, CreditCard, Gift, Landmark, Lock, ShieldCheck, ShoppingBag, Smartphone, Sparkles, Wallet } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { site } from '@/config/site';
import { computeTotals } from '@/lib/pricing';
import { cn, formatMoney, pluralize } from '@/lib/utils';
import { cartCount, useCart } from '@/store/cart';
import { useMounted } from '@/hooks/use-mounted';
import { useStoreSettings } from '@/components/providers/SettingsProvider';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Field';
import { useCoupon } from '@/components/commerce/coupon-store';
import { AddressFields, emptyAddress, type AddressDraft } from '@/components/commerce/AddressFields';
import { FormField } from '@/components/commerce/FormField';
import { defaultCountry } from '@/components/commerce/countries';
import { PAYMENT_METHODS, checkoutSchema, fieldErrors, type PaymentMethodId } from '@/components/commerce/schemas';
import { CouponField, validateCouponCode } from './CouponField';
import { TotalsList } from './TotalsList';
import { SummaryLine } from './SummaryLine';
import { PaymentMarks, SecureNote, TrustBadges } from './TrustBadges';
import { DemoPaymentSheet } from './DemoPaymentSheet';
import { loadRazorpay } from './razorpay';
import { LAST_ORDER_KEY } from './constants';
import { toLineInput, useQuote, type CouponResult, type QuoteIssue } from './use-quote';

export type SavedAddress = {
  id: string;
  label: string | null;
  firstName: string;
  lastName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
};

type Totals = { subtotal: number; discount: number; shipping: number; tax: number; total: number };
export type PlaceResult =
  | { mode: 'demo'; orderNumber: string; receiptToken: string; amount: number; currency: string; totals: Totals }
  | {
      mode: 'razorpay';
      orderNumber: string;
      receiptToken: string;
      keyId: string;
      razorpayOrderId: string;
      amount: number;
      currency: string;
      totals: Totals;
      prefill: { name: string; email: string; contact: string; method?: string };
    };

type Phase = 'idle' | 'placing' | 'paying' | 'verifying' | 'failed';


const PAY_ICONS: Record<PaymentMethodId, typeof CreditCard> = {
  razorpay: Sparkles,
  upi: Smartphone,
  card: CreditCard,
  netbanking: Landmark,
  wallet: Wallet,
};

function splitName(name?: string | null) {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  return { firstName: parts[0] ?? '', lastName: parts.slice(1).join(' ') };
}

function Section({ step, title, aside, children, id }: { step: number; title: string; aside?: ReactNode; children: ReactNode; id: string }) {
  return (
    <section aria-labelledby={`${id}-title`} className="border-t border-line pt-8 first:border-t-0 first:pt-0">
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <h2 id={`${id}-title`} className="flex items-baseline gap-3 font-serif text-[26px] font-light leading-none">
          <span className="font-sans text-[11px] font-medium tracking-[0.18em] text-gold">{String(step).padStart(2, '0')}</span>
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

function RadioDot({ checked }: { checked: boolean }) {
  return (
    <span className={cn('mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border transition-colors', checked ? 'border-ink' : 'border-stone')} aria-hidden>
      <span className={cn('h-2 w-2 rounded-full bg-ink transition-transform duration-200', checked ? 'scale-100' : 'scale-0')} />
    </span>
  );
}

export function CheckoutView({ user, addresses, paymentMode }: { user: { name: string | null; email: string; phone: string | null } | null; addresses: SavedAddress[]; paymentMode: 'razorpay' | 'demo' }) {
  const mounted = useMounted();
  const router = useRouter();
  const settings = useStoreSettings();
  const lines = useCart((s) => s.lines);
  const code = useCoupon((s) => s.code);
  const setCode = useCoupon((s) => s.setCode);

  const initialName = splitName(user?.name);
  const [customer, setCustomer] = useState({ ...initialName, email: user?.email ?? '', phone: user?.phone ?? '' });
  const defaultSaved = addresses.find((a) => a.isDefault) ?? addresses[0];
  const [addressMode, setAddressMode] = useState<'saved' | 'new'>(defaultSaved ? 'saved' : 'new');
  const [addressId, setAddressId] = useState<string | null>(defaultSaved?.id ?? null);
  const [address, setAddress] = useState<AddressDraft>(() => emptyAddress(defaultCountry()));
  const [gift, setGift] = useState(false);
  const [saveAddress, setSaveAddress] = useState(true);
  const [deliveryMethod, setDeliveryMethod] = useState(settings.shippingMethods[0]?.id ?? '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>('razorpay');
  const [showNote, setShowNote] = useState(false);
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [serverIssues, setServerIssues] = useState<Map<string, QuoteIssue>>(new Map());
  const [phase, setPhase] = useState<Phase>('idle');
  const [pending, setPending] = useState<{ result: PlaceResult; fingerprint: string } | null>(null);
  const [demoOpen, setDemoOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [justApplied, setJustApplied] = useState<CouponResult | null>(null);

  const { quote, last, loading, issuesByKey } = useQuote({ lines, couponCode: code, deliveryMethod, enabled: mounted && lines.length > 0 });
  const method = settings.shippingMethods.find((m) => m.id === deliveryMethod) ?? settings.shippingMethods[0];
  const latest = quote?.coupon ?? last?.coupon ?? null;
  const coupon = code ? (latest && latest.code === code ? latest : justApplied?.code === code ? justApplied : null) : null;
  const totals = computeTotals({ lines, shippingPrice: method?.price ?? 0, discount: coupon?.ok ? coupon.discount : 0, taxRate: settings.taxRate });

  const keySig = lines.map((l) => `${l.key}*${l.quantity}`).join(',');
  useEffect(() => setServerIssues(new Map()), [keySig]);

  const issues = useMemo(() => {
    const m = new Map(issuesByKey);
    for (const [k, v] of serverIssues) m.set(k, v);
    return m;
  }, [issuesByKey, serverIssues]);

  const busy = phase === 'placing' || phase === 'verifying' || (phase === 'paying' && !demoOpen);

  const setField = (key: string) => setErrors((e) => (e[key] ? Object.fromEntries(Object.entries(e).filter(([k]) => k !== key)) : e));

  function buildPayload() {
    const errs: Record<string, string> = {};
    const c = { firstName: customer.firstName.trim(), lastName: customer.lastName.trim(), email: customer.email.trim(), phone: customer.phone.trim() };
    if (!c.firstName) errs['customer.firstName'] = 'Enter your first name';
    if (!c.lastName) errs['customer.lastName'] = 'Enter your last name';
    const useSaved = addressMode === 'saved' && !!addressId;
    const payload = {
      customer: { name: `${c.firstName} ${c.lastName}`.trim(), email: c.email, phone: c.phone },
      addressId: useSaved ? addressId : null,
      address: useSaved
        ? null
        : {
            label: null,
            firstName: gift ? address.firstName : c.firstName,
            lastName: gift ? address.lastName : c.lastName,
            phone: gift ? address.phone : c.phone,
            line1: address.line1,
            line2: address.line2 || null,
            city: address.city,
            state: address.state,
            postalCode: address.postalCode,
            country: address.country,
          },
      saveAddress: !!user && !useSaved && saveAddress,
      deliveryMethod,
      paymentMethod,
      couponCode: coupon?.ok ? coupon.code : null,
      notes: note.trim() || null,
      lines: lines.map(toLineInput),
    };
    const parsed = checkoutSchema.safeParse(payload);
    if (!parsed.success) {
      for (const [k, msg] of Object.entries(fieldErrors(parsed.error))) {
        let key = k;
        if (k === 'customer.name') key = 'customer.firstName';
        if (!gift && (k === 'address.firstName' || k === 'address.lastName' || k === 'address.phone')) key = k.replace('address.', 'customer.');
        if (!errs[key]) errs[key] = msg;
      }
    }
    return { payload, errs };
  }

  const focusFirstError = () =>
    requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>('#checkout-form [aria-invalid="true"]');
      el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      el?.focus({ preventScroll: true });
    });

  const goSuccess = (orderNumber: string) => {
    setPhase('verifying');
    router.push(`/checkout/success?order=${encodeURIComponent(orderNumber)}`);
  };

  async function openPayment(r: PlaceResult) {
    setFormError(null);
    if (r.mode === 'demo') {
      setPhase('paying');
      setDemoOpen(true);
      return;
    }
    setPhase('paying');
    const ok = await loadRazorpay();
    if (!ok || !window.Razorpay) {
      setPhase('failed');
      setFormError('We couldn’t open the secure payment window. Please check your connection and try again — your order has been saved.');
      return;
    }
    let failure: string | null = null;
    const rzp = new window.Razorpay({
      key: r.keyId,
      amount: r.amount,
      currency: r.currency,
      order_id: r.razorpayOrderId,
      name: site.name,
      description: `Order ${r.orderNumber}`,
      prefill: r.prefill,
      notes: { orderNumber: r.orderNumber },
      theme: { color: '#141311' },
      modal: {
        confirm_close: true,
        ondismiss: () => {
          setPhase((p) => (p === 'verifying' ? p : 'failed'));
          setFormError(failure ? `Payment was not completed: ${failure}` : 'The payment window was closed before payment completed. Your order is saved — you can retry whenever you’re ready.');
        },
      },
      handler: async (resp) => {
        setPhase('verifying');
        try {
          const res = await fetch('/api/payments/razorpay/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderNumber: r.orderNumber, ...resp }),
          });
          const json = (await res.json().catch(() => ({}))) as { error?: string };
          if (!res.ok) throw new Error(json.error ?? 'We could not confirm your payment.');
          goSuccess(r.orderNumber);
        } catch (e) {
          setPhase('failed');
          setFormError((e as Error).message);
        }
      },
    });
    rzp.on('payment.failed', (resp) => {
      failure = resp.error?.description ?? 'the payment was declined';
    });
    rzp.open();
  }

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    if (busy) return;
    setFormError(null);
    if (issues.size) {
      setFormError('Some pieces in your bag need attention before you can place your order.');
      setSummaryOpen(true);
      document.getElementById('order-summary')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    const { payload, errs } = buildPayload();
    setErrors(errs);
    if (Object.keys(errs).length) {
      setFormError('Please complete the highlighted details.');
      focusFirstError();
      return;
    }
    const fingerprint = JSON.stringify(payload);
    if (pending && pending.fingerprint === fingerprint) return openPayment(pending.result);

    setPhase('placing');
    try {
      const res = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: fingerprint });
      const json = (await res.json().catch(() => ({}))) as PlaceResult & { error?: string; fieldErrors?: Record<string, string>; issues?: QuoteIssue[] };
      if (!res.ok) {
        setPhase('idle');
        setFormError(json.error ?? 'We couldn’t place your order. Please try again.');
        if (json.issues?.length) {
          const m = new Map<string, QuoteIssue>();
          for (const i of json.issues) if (lines[i.index]) m.set(lines[i.index].key, i);
          setServerIssues(m);
          setSummaryOpen(true);
        }
        if (json.fieldErrors) {
          const mapped: Record<string, string> = {};
          for (const [k, v] of Object.entries(json.fieldErrors)) {
            if (k === 'couponCode') {
              setCode(null);
              continue;
            }
            mapped[!gift && /^address\.(firstName|lastName|phone)$/.test(k) ? k.replace('address.', 'customer.') : k === 'customer.name' ? 'customer.firstName' : k] = v;
          }
          setErrors(mapped);
          focusFirstError();
        }
        if (res.status === 401) router.push('/account/login?callbackUrl=/checkout');
        return;
      }
      try {
        sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify({ number: json.orderNumber, token: json.receiptToken }));
      } catch {
        /* storage unavailable — confirmation remains visible to signed-in owners */
      }
      setPending({ result: json, fingerprint });
      await openPayment(json);
    } catch {
      setPhase('idle');
      setFormError('We couldn’t reach our servers. Check your connection and try again.');
    }
  }

  if (!mounted) {
    return (
      <div className="container-x py-12" aria-busy="true">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="space-y-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-28 animate-pulse bg-porcelain" />
            ))}
          </div>
          <div className="hidden h-96 animate-pulse bg-porcelain lg:block" />
        </div>
      </div>
    );
  }

  if (!lines.length && phase !== 'verifying') {
    return (
      <div className="container-x flex flex-col items-center py-24 text-center">
        <ShoppingBag className="h-10 w-10 text-gold" strokeWidth={1} aria-hidden />
        <h1 className="mt-6 font-serif text-4xl font-light">Your bag is empty</h1>
        <p className="mt-3 max-w-md text-taupe">Add a piece to your bag to begin checkout.</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/collections/all">Explore Jewelry</ButtonLink>
          <ButtonLink href="/wishlist" variant="outline">
            View Wishlist
          </ButtonLink>
        </div>
      </div>
    );
  }

  const count = cartCount(lines);
  const ctaLabel = phase === 'placing' ? 'Securing your order…' : phase === 'verifying' ? 'Confirming payment…' : pending && phase === 'failed' ? 'Retry Payment' : `Pay ${formatMoney(totals.total, { exact: true })}`;

  const summary = (
    <div>
      <ul className="divide-y divide-line" aria-label="Pieces in this order">
        {lines.map((l) => (
          <SummaryLine
            key={l.key}
            issue={issues.get(l.key)?.message}
            line={{
              key: l.key,
              name: l.name,
              purity: l.purity,
              metalColor: l.metalColor,
              details: [l.diamond?.summary, l.option?.label, l.ringSize ? `Ring size ${l.ringSize}` : null],
              quantity: l.quantity,
              lineTotal: l.unitPrice * l.quantity,
              art: l.art,
              image: l.image,
              shape: l.shape,
              carat: l.carat,
            }}
          />
        ))}
      </ul>
      {issues.size > 0 && (
        <p className="mb-4 text-[12.5px] text-taupe">
          <Link href="/cart" className="text-ink underline underline-offset-4">
            Review your bag
          </Link>{' '}
          to update or remove these pieces.
        </p>
      )}
      <div className="border-y border-line py-4">
        <CouponField
          applied={code ? { code, ok: coupon?.ok ?? true, message: coupon?.message ?? 'Checking…' } : null}
          onApply={async (c) => {
            const r = await validateCouponCode(c, totals.subtotal);
            if (r.ok) {
              setJustApplied(r);
              setCode(r.code);
            }
            return r;
          }}
          onRemove={() => {
            setCode(null);
            setJustApplied(null);
          }}
        />
      </div>
      <TotalsList
        className="mt-5"
        totals={totals}
        couponCode={coupon?.ok ? coupon.code : null}
        taxLabel={settings.taxLabel}
        taxRate={settings.taxRate}
        shippingLabel={method ? method.label : 'Shipping'}
        shippingNote={method?.eta}
        loading={loading}
      />
    </div>
  );

  return (
    <>
      <div className="border-b border-line bg-porcelain/60">
        <div className="container-x flex h-14 items-center justify-between gap-4">
          <Link href="/cart" className="label-caps group flex items-center gap-2 text-charcoal hover:text-ink">
            <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-x-1" strokeWidth={1.5} aria-hidden /> Back to bag
          </Link>
          <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-taupe">
            <Lock className="h-3.5 w-3.5 text-gold" strokeWidth={1.5} aria-hidden /> Secure checkout
          </p>
        </div>
      </div>

      {/* Mobile summary toggle */}
      <div className="border-b border-line bg-white/60 lg:hidden">
        <button
          type="button"
          onClick={() => setSummaryOpen((v) => !v)}
          aria-expanded={summaryOpen}
          aria-controls="mobile-summary"
          className="container-x flex h-14 w-full items-center justify-between gap-4"
        >
          <span className="flex items-center gap-2 text-[13px] text-charcoal">
            <ShoppingBag className="h-4 w-4 text-gold" strokeWidth={1.25} aria-hidden />
            {summaryOpen ? 'Hide' : 'Show'} order summary
            <ChevronDown className={cn('h-4 w-4 transition-transform duration-300', summaryOpen && 'rotate-180')} strokeWidth={1.25} aria-hidden />
            {issues.size > 0 && <AlertCircle className="h-4 w-4 text-danger" strokeWidth={1.5} aria-label="Needs attention" />}
          </span>
          <span className="text-base tabular-nums" aria-live="polite">
            {formatMoney(totals.total, { exact: true })}
          </span>
        </button>
        <AnimatePresence initial={false}>
          {summaryOpen && (
            <m.div
              id="mobile-summary"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="container-x pb-6">{summary}</div>
            </m.div>
          )}
        </AnimatePresence>
      </div>

      <div className="container-x pb-36 pt-8 lg:pb-24 lg:pt-12">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_400px] xl:grid-cols-[minmax(0,1fr)_440px] xl:gap-20">
          <form id="checkout-form" onSubmit={submit} noValidate className="min-w-0 space-y-10">
            <div>
              <p className="eyebrow">Checkout</p>
              <h1 className="mt-2 font-serif text-4xl font-light sm:text-5xl">Secure Checkout</h1>
            </div>

            <Section
              step={1}
              id="contact"
              title="Customer information"
              aside={
                user ? (
                  <p className="text-[12.5px] text-taupe">
                    Signed in as <span className="text-ink">{user.email}</span>
                  </p>
                ) : (
                  <p className="text-[12.5px] text-taupe">
                    Have an account?{' '}
                    <Link href="/account/login?callbackUrl=%2Fcheckout" className="text-ink underline underline-offset-4 hover:text-gold-deep">
                      Sign in for faster checkout
                    </Link>
                  </p>
                )
              }
            >
              <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                <FormField
                  id="customer-firstName"
                  label="First name"
                  required
                  className="col-span-2 xs:col-span-1"
                  autoComplete="given-name"
                  maxLength={60}
                  value={customer.firstName}
                  onChange={(e) => {
                    setCustomer((c) => ({ ...c, firstName: e.target.value }));
                    setField('customer.firstName');
                  }}
                  error={errors['customer.firstName']}
                />
                <FormField
                  id="customer-lastName"
                  label="Last name"
                  required
                  className="col-span-2 xs:col-span-1"
                  autoComplete="family-name"
                  maxLength={60}
                  value={customer.lastName}
                  onChange={(e) => {
                    setCustomer((c) => ({ ...c, lastName: e.target.value }));
                    setField('customer.lastName');
                  }}
                  error={errors['customer.lastName']}
                />
                <FormField
                  id="customer-email"
                  label="Email"
                  required
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  maxLength={160}
                  className="col-span-2 sm:col-span-1"
                  value={customer.email}
                  onChange={(e) => {
                    setCustomer((c) => ({ ...c, email: e.target.value }));
                    setField('customer.email');
                  }}
                  error={errors['customer.email']}
                  hint="For your order confirmation and updates"
                />
                <FormField
                  id="customer-phone"
                  label="Phone"
                  required
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  maxLength={24}
                  className="col-span-2 sm:col-span-1"
                  value={customer.phone}
                  onChange={(e) => {
                    setCustomer((c) => ({ ...c, phone: e.target.value }));
                    setField('customer.phone');
                  }}
                  error={errors['customer.phone']}
                  hint="For insured delivery coordination"
                />
              </div>
            </Section>

            <Section
              step={2}
              id="shipping"
              title="Shipping address"
              aside={
                user && addresses.length > 0 ? (
                  <Link href="/account/addresses" className="text-[12.5px] text-taupe underline-offset-4 hover:text-ink hover:underline">
                    Manage address book
                  </Link>
                ) : undefined
              }
            >
              {addresses.length > 0 && (
                <fieldset className="mb-6">
                  <legend className="sr-only">Choose a shipping address</legend>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {addresses.map((a) => {
                      const checked = addressMode === 'saved' && addressId === a.id;
                      return (
                        <label
                          key={a.id}
                          className={cn(
                            'flex cursor-pointer gap-3 border p-4 transition-colors has-[:focus-visible]:ring-1 has-[:focus-visible]:ring-gold',
                            checked ? 'border-ink bg-white' : 'border-line hover:border-stone',
                          )}
                        >
                          <input
                            type="radio"
                            name="saved-address"
                            value={a.id}
                            checked={checked}
                            onChange={() => {
                              setAddressMode('saved');
                              setAddressId(a.id);
                            }}
                            className="sr-only"
                          />
                          <RadioDot checked={checked} />
                          <span className="min-w-0 text-[13px] leading-relaxed">
                            <span className="flex items-center gap-2">
                              <span className="font-medium text-ink">{a.label || `${a.firstName} ${a.lastName}`}</span>
                              {a.isDefault && <span className="border border-gold/40 px-1.5 text-[9.5px] uppercase tracking-[0.16em] text-gold-deep">Default</span>}
                            </span>
                            <span className="block text-taupe">
                              {a.firstName} {a.lastName}
                              <br />
                              {a.line1}
                              {a.line2 ? `, ${a.line2}` : ''}
                              <br />
                              {a.city}, {a.state} {a.postalCode}
                              <br />
                              {a.country}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                    <label
                      className={cn(
                        'flex cursor-pointer items-center gap-3 border border-dashed p-4 transition-colors has-[:focus-visible]:ring-1 has-[:focus-visible]:ring-gold',
                        addressMode === 'new' ? 'border-ink bg-white' : 'border-stone hover:border-ink',
                      )}
                    >
                      <input type="radio" name="saved-address" value="new" checked={addressMode === 'new'} onChange={() => setAddressMode('new')} className="sr-only" />
                      <RadioDot checked={addressMode === 'new'} />
                      <span className="text-[13px] text-ink">Ship to a new address</span>
                    </label>
                  </div>
                  {errors.addressId && <p className="mt-2 text-xs text-danger">{errors.addressId}</p>}
                </fieldset>
              )}

              <AnimatePresence initial={false}>
                {addressMode === 'new' && (
                  <m.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-6 p-px">
                      <label className="flex cursor-pointer items-start gap-3 text-[13.5px] text-charcoal">
                        <input type="checkbox" checked={gift} onChange={(e) => setGift(e.target.checked)} className="mt-1 h-4 w-4 accent-ink" />
                        <span>
                          <span className="flex items-center gap-1.5 text-ink">
                            <Gift className="h-3.5 w-3.5 text-gold" strokeWidth={1.5} aria-hidden /> Sending a gift?
                          </span>
                          <span className="text-[12.5px] text-taupe">Ship to someone else — prices are never included in the parcel.</span>
                        </span>
                      </label>
                      <AddressFields
                        idPrefix="address"
                        value={address}
                        onChange={(f, v) => {
                          setAddress((a) => ({ ...a, [f]: v }));
                          setField(`address.${f}`);
                        }}
                        errors={errors}
                        errorPrefix="address."
                        withContact={gift}
                      />
                      {user && (
                        <label className="flex cursor-pointer items-center gap-3 text-[13.5px] text-charcoal">
                          <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} className="h-4 w-4 accent-ink" />
                          Save this address to my account
                        </label>
                      )}
                    </div>
                  </m.div>
                )}
              </AnimatePresence>

              <div className="mt-6">
                {showNote ? (
                  <div>
                    <label htmlFor="order-note" className="mb-2 block text-[11px] font-medium uppercase tracking-[0.14em] text-charcoal">
                      Gift message or delivery note <span className="normal-case tracking-normal text-taupe">(optional)</span>
                    </label>
                    <Textarea id="order-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} className="min-h-[96px]" placeholder="A few words for the card, or instructions for our courier" />
                    <p className="mt-1 text-right text-[11px] text-taupe">{note.length}/500</p>
                  </div>
                ) : (
                  <button type="button" onClick={() => setShowNote(true)} className="text-[12.5px] text-taupe underline-offset-4 hover:text-ink hover:underline">
                    + Add a gift message or delivery note
                  </button>
                )}
              </div>
            </Section>

            <Section step={3} id="delivery" title="Delivery method">
              <fieldset>
                <legend className="sr-only">Delivery method</legend>
                <div className="space-y-3">
                  {settings.shippingMethods.map((m) => {
                    const checked = deliveryMethod === m.id;
                    return (
                      <label
                        key={m.id}
                        className={cn(
                          'flex cursor-pointer items-start gap-4 border p-4 transition-colors has-[:focus-visible]:ring-1 has-[:focus-visible]:ring-gold sm:p-5',
                          checked ? 'border-ink bg-white' : 'border-line hover:border-stone',
                        )}
                      >
                        <input type="radio" name="delivery" value={m.id} checked={checked} onChange={() => setDeliveryMethod(m.id)} className="sr-only" />
                        <RadioDot checked={checked} />
                        <span className="min-w-0 flex-1">
                          <span className="block text-[14px] text-ink">{m.label}</span>
                          <span className="block text-[12.5px] text-taupe">{m.description}</span>
                        </span>
                        <span className="shrink-0 text-right">
                          <span className="block text-[14px] tabular-nums">{m.price ? formatMoney(m.price) : 'Complimentary'}</span>
                          <span className="block text-[12px] text-taupe">{m.eta}</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
              <p className="mt-4 flex items-start gap-2 text-[12.5px] text-taupe">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold" strokeWidth={1.25} aria-hidden />
                Every parcel is fully insured, discreetly packaged and requires a signature on delivery. Made-to-order pieces ship once crafted and quality checked.
              </p>
            </Section>

            <Section step={4} id="payment" title="Payment" aside={paymentMode === 'demo' ? <span className="border border-gold/50 bg-gold-pale/60 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-gold-deep">Test mode</span> : undefined}>
              <fieldset>
                <legend className="sr-only">Payment method</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {PAYMENT_METHODS.map((m, i) => {
                    const Icon = PAY_ICONS[m.id];
                    const checked = paymentMethod === m.id;
                    return (
                      <label
                        key={m.id}
                        className={cn(
                          'flex cursor-pointer items-start gap-3 border p-4 transition-colors has-[:focus-visible]:ring-1 has-[:focus-visible]:ring-gold',
                          i === 0 && 'sm:col-span-2',
                          checked ? 'border-ink bg-white' : 'border-line hover:border-stone',
                        )}
                      >
                        <input type="radio" name="payment" value={m.id} checked={checked} onChange={() => setPaymentMethod(m.id)} className="sr-only" />
                        <RadioDot checked={checked} />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2 text-[14px] text-ink">
                            {m.label}
                            {i === 0 && <span className="text-[10px] uppercase tracking-[0.16em] text-gold-deep">Recommended</span>}
                          </span>
                          <span className="block text-[12.5px] text-taupe">{m.description}</span>
                        </span>
                        <Icon className={cn('h-5 w-5 shrink-0', checked ? 'text-gold' : 'text-stone')} strokeWidth={1.1} aria-hidden />
                      </label>
                    );
                  })}
                </div>
              </fieldset>
              <div className="mt-5 space-y-3 bg-porcelain px-4 py-4 sm:px-5">
                <SecureNote />
                <p className="text-[12px] text-taupe">
                  You’ll complete payment in Razorpay’s secure window. {site.name} never sees or stores your card details.
                </p>
                {paymentMode === 'demo' && (
                  <p className="border-t border-line pt-3 text-[12px] text-charcoal">
                    <span className="font-medium">Demo store:</span> live payment keys aren’t configured, so you’ll confirm a simulated payment — no real charge is made.
                  </p>
                )}
              </div>
              <PaymentMarks className="mt-4" />
            </Section>

            <div className="space-y-4 border-t border-line pt-8">
              <AnimatePresence>
                {formError && (
                  <m.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    role="alert"
                    className="flex items-start gap-3 border border-danger/30 bg-danger/5 px-4 py-3 text-[13px] text-danger"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden />
                    <div>
                      <p>{formError}</p>
                      {pending && phase === 'failed' && <p className="mt-1 text-charcoal">Order reference {pending.result.orderNumber} is held for you.</p>}
                    </div>
                  </m.div>
                )}
              </AnimatePresence>
              <Button type="submit" size="lg" className="hidden w-full lg:inline-flex" loading={busy} disabled={busy}>
                {!busy && <Lock className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />}
                {ctaLabel}
              </Button>
              <p className="text-center text-[12px] leading-relaxed text-taupe">
                By placing your order you agree to our{' '}
                <Link href="/pages/terms" className="underline underline-offset-2 hover:text-ink">
                  Terms
                </Link>{' '}
                and{' '}
                <Link href="/pages/privacy-policy" className="underline underline-offset-2 hover:text-ink">
                  Privacy Policy
                </Link>
                . {settings.returnsDays}-day returns on every piece.
              </p>
            </div>
          </form>

          <aside id="order-summary" aria-label="Order summary" className="hidden lg:block lg:sticky lg:top-28 lg:self-start">
            <div className="border border-line bg-white/70 p-6 xl:p-8">
              <div className="flex items-baseline justify-between">
                <h2 className="font-serif text-2xl">Order Summary</h2>
                <Link href="/cart" className="text-[12px] text-taupe underline-offset-4 hover:text-ink hover:underline">
                  Edit bag ({pluralize(count, 'piece')})
                </Link>
              </div>
              <div className="mt-2">{summary}</div>
              <Button type="submit" form="checkout-form" size="lg" className="mt-6 w-full" loading={busy} disabled={busy}>
                {!busy && <Lock className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />}
                {ctaLabel}
              </Button>
              <SecureNote className="mt-4 justify-center" />
            </div>
            <TrustBadges compact returnsDays={settings.returnsDays} className="mt-8 px-1" />
          </aside>
        </div>
      </div>

      {/* Mobile sticky total + CTA */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ivory/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md lg:hidden">
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => setSummaryOpen(true)} className="min-w-0 flex-1 text-left" aria-label="Show order summary">
            <span className="block text-[11px] uppercase tracking-[0.14em] text-taupe">Total · {pluralize(count, 'piece')}</span>
            <span className="block text-lg tabular-nums">{formatMoney(totals.total, { exact: true })}</span>
          </button>
          <Button type="submit" form="checkout-form" className="h-12 flex-[1.4] px-3" loading={busy} disabled={busy}>
            {phase === 'failed' && pending ? 'Retry Payment' : busy ? 'Please wait' : 'Place Order'}
          </Button>
        </div>
      </div>

      {pending?.result.mode === 'demo' && (
        <DemoPaymentSheet
          open={demoOpen}
          orderNumber={pending.result.orderNumber}
          token={pending.result.receiptToken}
          amount={pending.result.amount}
          paymentLabel={PAYMENT_METHODS.find((m) => m.id === paymentMethod)?.label ?? 'Razorpay'}
          onCancel={() => {
            setDemoOpen(false);
            setPhase('failed');
            setFormError('Payment was not completed. Your order is saved — you can retry whenever you’re ready.');
          }}
          onPaid={() => {
            setDemoOpen(false);
            goSuccess(pending.result.orderNumber);
          }}
        />
      )}
      {phase === 'verifying' && (
        <div className="fixed inset-0 z-[85] flex items-center justify-center bg-ivory/80 backdrop-blur-sm" role="status" aria-live="assertive">
          <div className="flex flex-col items-center text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full border border-gold/40">
              <Check className="h-6 w-6 text-gold" strokeWidth={1.25} aria-hidden />
            </span>
            <p className="mt-5 font-serif text-2xl">Confirming your order…</p>
            <p className="mt-1 text-sm text-taupe">Please don’t close this window.</p>
          </div>
        </div>
      )}
    </>
  );
}
