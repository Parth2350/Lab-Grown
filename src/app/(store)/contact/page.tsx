import { Clock, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { site } from '@/config/site';
import { pageMeta } from '@/lib/seo';
import { ButtonLink } from '@/components/ui/Button';
import { ContactForm } from '@/components/content/ContactForm';
import { FaqList, type Faq } from '@/components/content/FaqSection';
import { MapIllustration } from '@/components/content/illustrations';
import { ArrowLink, PageIntro } from '@/components/content/ui';

export const metadata = pageMeta({
  title: 'Contact Us',
  description: `Speak with the client care team at ${site.name} by WhatsApp, phone or email, or send us a message. Visit our ${site.contact.address.city} atelier by appointment.`,
  path: '/contact',
});

const FAQ_TEASER: Faq[] = [
  {
    q: 'How quickly will you reply?',
    a: 'We answer every message within one business day, and usually much sooner. WhatsApp is the fastest way to reach us during studio hours.',
  },
  {
    q: 'Can I visit your atelier?',
    a: `Yes — our ${site.contact.address.city} atelier welcomes visitors by appointment, so a designer and gemologist can give you their full attention. Send us a message with a few dates that suit you.`,
  },
  {
    q: 'Can you help me choose a diamond remotely?',
    a: 'Absolutely. Our gemologists can share videos of specific diamonds and talk you through their grading reports over a video call or WhatsApp.',
  },
  {
    q: 'Where can I track my order?',
    a: 'Your tracking link is emailed as soon as your order is dispatched. If you cannot find it, reply to your order confirmation or send us your order number.',
  },
];

export default function ContactPage() {
  const c = site.contact;
  const a = c.address;
  const channels = [
    { icon: MessageCircle, label: 'WhatsApp', value: c.whatsapp, href: c.whatsappHref, note: 'Fastest during studio hours', external: true },
    { icon: Mail, label: 'Email', value: c.email, href: `mailto:${c.email}`, note: 'Replies within one business day' },
    { icon: Phone, label: 'Telephone', value: c.phone, href: c.phoneHref, note: 'Speak with client care' },
  ];

  return (
    <>
      <PageIntro
        crumbs={[{ label: 'Contact', href: '/contact' }]}
        eyebrow="Client Care"
        title="We would love to hear from you"
        intro="Whether you are choosing an engagement ring, tracking an order or dreaming up something bespoke, our concierge team is here to help — personally and without pressure."
      />

      <section className="container-x pb-16 md:pb-24" aria-label="Ways to contact us">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          {/* form */}
          <div className="lg:col-span-7">
            <div className="border border-line bg-porcelain/50 p-5 sm:p-8 lg:p-10">
              <h2 className="font-serif text-[1.9rem] font-light leading-tight">Send us a message</h2>
              <p className="mb-8 mt-2 text-[16px] text-taupe">Fill in the form and a member of our team will be in touch.</p>
              <ContactForm />
            </div>
          </div>

          {/* direct channels */}
          <aside className="space-y-10 lg:col-span-5" aria-label="Contact details">
            <div>
              <h2 className="eyebrow font-sans mb-5">Speak with us directly</h2>
              <ul className="divide-y divide-line border-y border-line">
                {channels.map(({ icon: Icon, label, value, href, note, external }) => (
                  <li key={label}>
                    <a
                      href={href}
                      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                      className="group flex items-center gap-4 py-5 transition-colors"
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line text-gold transition-colors group-hover:border-gold">
                        <Icon className="h-[18px] w-[18px]" strokeWidth={1.25} aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="label-caps block text-taupe">{label}</span>
                        <span className="mt-0.5 block break-words text-[17px] text-ink group-hover:underline group-hover:underline-offset-4">{value}</span>
                      </span>
                      <span className="hidden text-right text-[14px] text-taupe sm:block">{note}</span>
                    </a>
                  </li>
                ))}
              </ul>
              <ButtonLink href={c.whatsappHref} target="_blank" rel="noopener noreferrer" variant="gold" size="lg" className="mt-6 w-full">
                <MessageCircle className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                Chat on WhatsApp
              </ButtonLink>
            </div>

            <div>
              <h2 className="eyebrow font-sans mb-5 flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden /> Studio hours
              </h2>
              <dl className="divide-y divide-line border-y border-line text-[16px]">
                {c.hours.map((h) => (
                  <div key={h.days} className="flex items-baseline justify-between gap-4 py-3">
                    <dt className="text-charcoal">{h.days}</dt>
                    <dd className="text-right text-ink">{h.time}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </aside>
        </div>
      </section>

      {/* atelier & map */}
      <section aria-labelledby="visit-title" className="border-y border-line bg-white">
        <div className="grid lg:grid-cols-12">
          <div className="relative min-h-[280px] overflow-hidden sm:min-h-[360px] lg:col-span-7 lg:min-h-[480px]">
            <MapIllustration className="absolute inset-0 h-full w-full" />
          </div>
          <div className="flex flex-col justify-center px-4 py-12 sm:px-10 lg:col-span-5 lg:px-14">
            <p className="eyebrow mb-4 flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden /> Visit the atelier
            </p>
            <h2 id="visit-title" className="h-section">
              {a.city}
            </h2>
            <address className="mt-6 not-italic leading-relaxed text-charcoal">
              {site.legalName}
              <br />
              {a.street}
              <br />
              {a.city} {a.postalCode}, {a.region}
              <br />
              {a.country}
            </address>
            <p className="mt-6 max-w-sm text-[16px] leading-relaxed text-taupe">
              Private appointments let you see diamonds side by side, try on settings and meet the artisans who will make your piece.
            </p>
            <ArrowLink href="/bespoke" className="mt-6">
              Book a design consultation
            </ArrowLink>
          </div>
        </div>
      </section>

      {/* FAQ teaser */}
      <section aria-labelledby="contact-faq-title" className="container-x py-16 md:py-24">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <p className="eyebrow mb-3">Quick answers</p>
            <h2 id="contact-faq-title" className="h-section">
              Before you write
            </h2>
            <p className="mt-4 max-w-sm text-[17px] leading-relaxed text-taupe">The questions our concierge hears most often.</p>
            <ArrowLink href="/pages/faq" className="mt-6">
              Visit the full FAQ
            </ArrowLink>
          </div>
          <div className="lg:col-span-8">
            <FaqList items={FAQ_TEASER} />
          </div>
        </div>
      </section>
    </>
  );
}
