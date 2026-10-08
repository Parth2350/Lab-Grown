import Link from 'next/link';
import { ArrowRight, BookOpen, Gem, Mail, MessageCircle, Phone, ShieldCheck, Sparkles } from 'lucide-react';
import { site } from '@/config/site';
import { pageMeta } from '@/lib/seo';
import { requireUser } from '@/lib/server/auth';

export const metadata = pageMeta({ title: 'Support', description: 'Speak with our concierge.', path: '/account/support', noIndex: true });

export default async function SupportPage() {
  await requireUser('/account/support');
  const channels = [
    { icon: Phone, label: 'Call the studio', value: site.contact.phone, href: site.contact.phoneHref, note: 'Speak with a diamond specialist' },
    { icon: MessageCircle, label: 'WhatsApp', value: site.contact.whatsapp, href: site.contact.whatsappHref, note: 'Photos, videos and quick questions', external: true },
    { icon: Mail, label: 'Email', value: site.contact.email, href: `mailto:${site.contact.email}`, note: 'We reply within one business day' },
  ];
  const guides = [
    { icon: BookOpen, label: 'Frequently asked questions', href: '/pages/faq', text: 'Orders, sizing, shipping and payments' },
    { icon: Sparkles, label: 'Care guide', href: '/pages/care-guide', text: 'Keep every stone brilliant for decades' },
    { icon: ShieldCheck, label: 'Lifetime warranty', href: '/pages/warranty', text: 'What’s covered and how to make a claim' },
    { icon: Gem, label: 'Contact & appointments', href: '/contact', text: 'Visit the atelier or book a video consultation' },
  ];
  const a = site.contact.address;

  return (
    <div className="space-y-12">
      <div>
        <h2 className="font-serif text-3xl font-light">Concierge & support</h2>
        <p className="mt-1 max-w-2xl text-sm text-taupe">
          Every client has a dedicated specialist — for sizing, resizing, cleaning, a question about your certificate or a bespoke idea. Have your order number to hand and we’ll take it from there.
        </p>
      </div>

      <ul className="grid gap-3 md:grid-cols-3">
        {channels.map((c) => (
          <li key={c.label}>
            <a
              href={c.href}
              {...(c.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="group flex h-full flex-col border border-line p-6 transition-colors hover:border-ink"
            >
              <c.icon className="h-5 w-5 text-gold" strokeWidth={1.1} aria-hidden />
              <span className="mt-5 text-[13px] uppercase tracking-[0.16em] text-taupe">{c.label}</span>
              <span className="mt-1 break-words font-serif text-xl text-ink">{c.value}</span>
              <span className="mt-1 text-[14.5px] text-taupe">{c.note}</span>
            </a>
          </li>
        ))}
      </ul>

      <div className="grid gap-10 border-t border-line pt-10 md:grid-cols-[minmax(0,1fr)_280px]">
        <section aria-labelledby="guides-title">
          <h3 id="guides-title" className="font-serif text-2xl">
            Helpful guides
          </h3>
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {guides.map((g) => (
              <li key={g.href}>
                <Link href={g.href} className="group flex items-center gap-4 py-4 transition-colors hover:bg-porcelain/50 sm:px-2">
                  <g.icon className="h-4 w-4 shrink-0 text-gold" strokeWidth={1.25} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[16px] text-ink">{g.label}</span>
                    <span className="block text-[14.5px] text-taupe">{g.text}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 text-stone transition-all group-hover:translate-x-1 group-hover:text-ink" strokeWidth={1.25} aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <aside className="bg-porcelain p-6">
          <h3 className="label-caps text-taupe">Studio hours</h3>
          <dl className="mt-4 space-y-2 text-[15px]">
            {site.contact.hours.map((h) => (
              <div key={h.days} className="flex justify-between gap-4">
                <dt className="text-charcoal">{h.days}</dt>
                <dd className="text-right text-taupe">{h.time}</dd>
              </div>
            ))}
          </dl>
          <h3 className="label-caps mt-8 text-taupe">The atelier</h3>
          <address className="mt-3 text-[15px] not-italic leading-relaxed text-charcoal">
            {site.legalName}
            <br />
            {a.street}
            <br />
            {a.city}, {a.region} {a.postalCode}
            <br />
            {a.country}
          </address>
        </aside>
      </div>
    </div>
  );
}
