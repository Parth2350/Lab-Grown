import Link from 'next/link';
import { forwardRef, type ButtonHTMLAttributes, type ComponentProps } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'outline' | 'ghost' | 'light' | 'gold' | 'link';
type Size = 'sm' | 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-sans text-[11px] font-medium uppercase tracking-[0.18em] transition-all duration-300 ease-luxe disabled:cursor-not-allowed disabled:opacity-50 select-none';

const variants: Record<Variant, string> = {
  primary: 'bg-ink text-ivory hover:bg-charcoal border border-ink',
  outline: 'border border-ink/80 text-ink hover:bg-ink hover:text-ivory',
  ghost: 'text-ink hover:bg-porcelain',
  light: 'bg-ivory text-ink border border-ivory hover:bg-transparent hover:text-ivory',
  gold: 'bg-gold text-white border border-gold hover:bg-gold-deep hover:border-gold-deep',
  link: 'px-0 text-ink underline-offset-[6px] hover:underline',
};
const sizes: Record<Size, string> = {
  sm: 'h-9 px-4',
  md: 'h-12 px-7',
  lg: 'h-14 px-9 text-xs',
};

export function buttonClass(variant: Variant = 'primary', size: Size = 'md', className?: string) {
  return cn(base, variants[variant], variant === 'link' ? '' : sizes[size], className);
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; loading?: boolean };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', className, loading, children, disabled, ...props },
  ref,
) {
  return (
    <button ref={ref} className={buttonClass(variant, size, className)} disabled={disabled || loading} aria-busy={loading} {...props}>
      {loading && <span className="h-3.5 w-3.5 animate-spin rounded-full border border-current border-t-transparent" aria-hidden />}
      {children}
    </button>
  );
});

type LinkProps = ComponentProps<typeof Link> & { variant?: Variant; size?: Size };

export function ButtonLink({ variant = 'primary', size = 'md', className, ...props }: LinkProps) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}
