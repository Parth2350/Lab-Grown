'use client';
import { site } from '@/config/site';
import { whatsappUrl } from '@/lib/whatsapp';
import { cn } from '@/lib/utils';
import { SocialIcon } from '@/components/layout/SocialIcons';

/**
 * Opens WhatsApp (app on phones, WhatsApp Web on desktop) with a ready-written message.
 * `message` receives the site origin so product links in the text point at this site;
 * the link is rebuilt on click with the live origin.
 */
export function WhatsAppButton({
  message,
  children = 'Chat with us on WhatsApp',
  className,
  onClick,
}: {
  message: (origin: string) => string;
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <a
      href={whatsappUrl(message(site.url))}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => {
        e.currentTarget.href = whatsappUrl(message(window.location.origin));
        onClick?.();
      }}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl border border-[#25D366] bg-[#25D366] px-5 text-center text-sm font-semibold text-white transition-colors hover:border-[#1EBE5D] hover:bg-[#1EBE5D]',
        className,
      )}
    >
      <SocialIcon name="whatsapp" className="h-5 w-5 shrink-0" />
      <span>{children}</span>
    </a>
  );
}
