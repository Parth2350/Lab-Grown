import Link from 'next/link';
import { Award, Gem, MessageCircle, RefreshCcw } from 'lucide-react';
import { FOOTER_NAV } from '@/config/navigation';
import { site } from '@/config/site';
import { Logo } from './Logo';
import { SocialLinks } from './SocialIcons';
import { NewsletterForm } from './NewsletterForm';
import { CurrencySwitcher } from '@/components/providers/CurrencyProvider';

const PROMISES = [
  { icon: Gem, title: 'IGI & GIA Certified', text: 'Every diamond, independently graded' },
  { icon: Award, title: 'Lifetime Warranty', text: 'Manufacturing defects covered forever' },
  { icon: RefreshCcw, title: '30-Day Returns', text: 'Easy, insured & complimentary' },
  { icon: MessageCircle, title: 'Order on WhatsApp', text: 'Our team confirms every order personally' },
];

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-24 bg-ink text-ivory/80">
      <div className="border-b border-white/10">
        <ul className="container-x grid grid-cols-2 gap-6 py-10 lg:grid-cols-4">
          {PROMISES.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex items-start gap-4">
              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-gold-light" strokeWidth={1} />
              <div>
                <p className="label-caps text-ivory">{title}</p>
                <p className="mt-1 text-[15px] text-ivory/60">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="container-x grid gap-12 py-16 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Logo tone="light" variant="stacked" />
          <p className="mt-6 max-w-sm text-[16px] leading-relaxed text-ivory/60">{site.description}</p>
          <SocialLinks className="mt-6 text-ivory/80" />
        </div>
        <nav className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-5" aria-label="Footer">
          {[
            { title: 'Shop', links: FOOTER_NAV.shop },
            { title: 'Customer Care', links: FOOTER_NAV.care },
            { title: 'About', links: FOOTER_NAV.about },
          ].map((col) => (
            <div key={col.title}>
              <p className="label-caps mb-5 text-ivory">{col.title}</p>
              <ul className="space-y-3 text-[16px]">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="link-underline text-ivory/60 transition-colors hover:text-ivory">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
        <div className="lg:col-span-3">
          <p className="label-caps mb-3 text-ivory">{site.name} Letter</p>
          <p className="mb-5 text-[15px] text-ivory/60">New collections, private previews and diamond education. No noise.</p>
          <NewsletterForm />
          <div className="mt-8 space-y-1.5 text-[15px] text-ivory/60">
            <p>
              <a href={`mailto:${site.contact.email}`} className="hover:text-ivory">
                {site.contact.email}
              </a>
            </p>
            <p>
              <a href={site.contact.phoneHref} className="hover:text-ivory">
                {site.contact.phone}
              </a>
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-x flex flex-col items-center justify-between gap-4 py-6 text-[14px] text-ivory/50 lg:flex-row">
          <p>
            Copyright © {year} {site.name}. All rights reserved.
          </p>
          <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {FOOTER_NAV.legal.map((l) => (
              <li key={l.label}>
                <Link href={l.href} className="hover:text-ivory">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <CurrencySwitcher />
          <ul className="flex items-center gap-2" aria-label="Accepted payments">
            {['UPI', 'VISA', 'MC', 'AMEX', 'RuPay'].map((p) => (
              <li key={p} className="rounded-sm border border-white/15 px-2 py-1 text-[11.5px] font-medium tracking-wider text-ivory/70">
                {p}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
