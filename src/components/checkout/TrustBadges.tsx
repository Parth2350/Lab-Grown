import { Gem, Lock, RotateCcw, ShieldCheck, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';

export function TrustBadges({ returnsDays = 30, className, compact }: { returnsDays?: number; className?: string; compact?: boolean }) {
  const items = [
    { icon: Lock, title: 'Secure checkout', text: '256-bit SSL encryption' },
    { icon: ShieldCheck, title: 'Certified diamonds', text: 'Graded by IGI & GIA' },
    { icon: Truck, title: 'Insured delivery', text: 'Signed for, door to door' },
    { icon: RotateCcw, title: `${returnsDays}-day returns`, text: 'Complimentary & simple' },
    { icon: Gem, title: 'Lifetime warranty', text: 'On every piece we make' },
  ];
  return (
    <ul className={cn(compact ? 'grid grid-cols-2 gap-x-4 gap-y-4' : 'grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 lg:grid-cols-5', className)}>
      {items.slice(0, compact ? 4 : 5).map(({ icon: Icon, title, text }) => (
        <li key={title} className="flex items-start gap-3">
          <Icon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-gold" strokeWidth={1.1} aria-hidden />
          <div className="min-w-0">
            <p className="text-[12.5px] font-normal text-ink">{title}</p>
            <p className="text-[11.5px] leading-snug text-taupe">{text}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

const MARKS = ['UPI', 'Visa', 'Mastercard', 'Amex', 'RuPay', 'Net Banking', 'Wallets'];

/** Neutral text "marks" for accepted payment methods (no third-party logos). */
export function PaymentMarks({ className }: { className?: string }) {
  return (
    <ul className={cn('flex flex-wrap gap-1.5', className)} aria-label="Accepted payment methods">
      {MARKS.map((m) => (
        <li key={m} className="border border-line bg-white px-2 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-charcoal/80">
          {m}
        </li>
      ))}
    </ul>
  );
}

export function SecureNote({ className }: { className?: string }) {
  return (
    <p className={cn('flex items-center gap-2 text-[12px] text-taupe', className)}>
      <Lock className="h-3.5 w-3.5 text-gold" strokeWidth={1.5} aria-hidden />
      <span>
        <span className="text-charcoal">256-bit SSL encrypted.</span> Payments processed securely by Razorpay.
      </span>
    </p>
  );
}
