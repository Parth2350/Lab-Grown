import { BadgeCheck, Camera, ClipboardList, Gem, Globe, HandHeart, Laptop, Megaphone, PackageOpen, Share2, Sparkles, Store, Users, Wallet } from 'lucide-react';
import { site } from '@/config/site';
import { pageMeta } from '@/lib/seo';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ButtonLink } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { FaqSection, type Faq } from '@/components/content/FaqSection';
import { PartnerForm } from '@/components/content/PartnerForm';
import { ArtPanel, NumberedSteps } from '@/components/content/ui';

export const metadata = pageMeta({
  title: 'Partner Program',
  description: `Partner with ${site.name}: share certified lab-grown diamond jewelry with your audience and earn rewards on every sale — no inventory required. Apply today.`,
  path: '/partner-program',
});

const STEPS = [
  { title: 'Apply', text: 'Tell us about yourself, your audience and how you would love to share our jewelry. It takes about two minutes.', icon: <ClipboardList className="h-5 w-5" strokeWidth={1} aria-hidden /> },
  { title: 'Get Approved', text: 'Our partnerships team reviews every application personally and replies within five business days.', icon: <BadgeCheck className="h-5 w-5" strokeWidth={1} aria-hidden /> },
  { title: 'Share & Promote', text: 'Receive your personal link and code, plus imagery and talking points, and share the pieces you genuinely love.', icon: <Share2 className="h-5 w-5" strokeWidth={1} aria-hidden /> },
  { title: 'Earn Rewards', text: 'Earn commission on every completed order you refer, with transparent tracking and regular payouts.', icon: <Wallet className="h-5 w-5" strokeWidth={1} aria-hidden /> },
];

const BENEFITS = [
  { icon: Sparkles, t: 'Exclusive Rewards', d: 'Competitive commission on every completed sale, plus gifted pieces and bonuses for our most active partners.' },
  { icon: Globe, t: 'Global Opportunity', d: `We ship to more than ${site.stats.countries.replace('+', '')} countries, so your audience can shop wherever they are.` },
  { icon: PackageOpen, t: 'No Inventory Required', d: 'We handle making, insured shipping, returns and client care. You simply share.' },
  { icon: Gem, t: 'Premium Jewelry Designs', d: 'Certified lab-grown diamonds in solid gold, handcrafted in our own workshop — pieces you will be proud to recommend.' },
  { icon: Megaphone, t: 'Marketing Support', d: 'Original imagery, product details, launch previews and a dedicated partner manager to help your content shine.' },
  { icon: Laptop, t: 'Work From Anywhere', d: 'Everything happens online, on your schedule — from a studio, a boutique or the other side of the world.' },
];

const AUDIENCES = [
  { icon: Camera, t: 'Creators & influencers', d: 'Style, beauty, bridal and lifestyle voices with an engaged community.' },
  { icon: HandHeart, t: 'Wedding planners & stylists', d: 'Professionals guiding couples and clients through life’s biggest moments.' },
  { icon: Store, t: 'Boutiques & concept stores', d: 'Independent retailers looking to offer fine jewelry without holding stock.' },
  { icon: Users, t: 'Communities & bloggers', d: 'Writers, editors and community leaders with a passion for meaningful design.' },
];

const FAQS: Faq[] = [
  {
    q: 'Is there a cost to join?',
    a: 'No. The partner program is completely free to join, with no minimum sales targets.',
  },
  {
    q: 'How much can I earn?',
    a: 'You earn a commission on every completed order placed through your personal link or code. Rates are confirmed in your welcome pack and can increase as your referrals grow.',
  },
  {
    q: 'Do I need a large following?',
    a: 'Not at all. We value an engaged, trusted audience far more than raw follower numbers, and we welcome partners of every size.',
  },
  {
    q: 'When and how are commissions paid?',
    a: 'Commissions are confirmed once an order passes our 30-day returns window and are paid out monthly by bank transfer. You can follow every referral in real time.',
  },
  {
    q: 'Can I partner from outside India?',
    a: `Yes. ${site.name} partners are based all over the world, and we deliver to clients in more than ${site.stats.countries.replace('+', '')} countries.`,
  },
  {
    q: 'Will I receive jewelry to feature?',
    a: 'Approved partners may receive gifted or loaned pieces for content and events, depending on the collaboration. Your partner manager will discuss the options with you.',
  },
];

export default function PartnerProgramPage() {
  return (
    <>
      {/* ───────── hero ───────── */}
      <section className="container-x pb-16 pt-8 md:pb-24 md:pt-12">
        <Breadcrumbs items={[{ label: 'Partner Program', href: '/partner-program' }]} />
        <div className="mt-10 grid items-center gap-10 md:mt-14 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-6">
            <p className="eyebrow mb-4">Partner Program</p>
            <h1 className="h-display text-balance">Partner With {site.name}</h1>
            <p className="mt-6 max-w-xl text-[18px] leading-relaxed text-taupe md:text-[19px]">
              Share certified lab-grown diamond jewelry with the people who trust your taste — and be rewarded for every piece they fall in love with. No stock,
              no shipping, no fuss.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="#apply" size="lg">
                Apply Now
              </ButtonLink>
              <ButtonLink href="#how-it-works" variant="outline" size="lg">
                How It Works
              </ButtonLink>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:col-span-6">
            <Reveal className="mt-10">
              <ArtPanel spec={{ kind: 'hoops', size: 'medium' }} shape="round" metal="yellow" tone="warm" className="aspect-[4/5]" inset="p-6 sm:p-8" title="Pavé hoop earrings" />
            </Reveal>
            <Reveal delay={0.1}>
              <ArtPanel spec={{ kind: 'pendant', head: 'solitaire' }} shape="oval" metal="rose" className="aspect-[4/5]" inset="p-6 sm:p-8" title="An oval solitaire pendant" />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ───────── what it is ───────── */}
      <section aria-labelledby="about-program-title" className="border-y border-line bg-white py-16 md:py-20">
        <div className="container-x grid gap-8 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <p className="eyebrow mb-3">The Program</p>
            <h2 id="about-program-title" className="h-section">
              A partnership built on taste and trust
            </h2>
          </div>
          <div className="space-y-4 text-[18px] leading-relaxed text-charcoal/90 lg:col-span-7">
            <p>
              {site.name} Partner Program is a referral partnership for creators, stylists, planners and independent boutiques. When someone discovers our jewelry
              through your personal link or code and places an order, you earn a reward — while we take care of everything else, from crafting each piece to
              delivering it fully insured.
            </p>
            <p>
              We keep the program intentionally selective so that every partner receives genuine support: early access to new collections, original content to
              share and a real person to talk to.
            </p>
          </div>
        </div>
      </section>

      {/* ───────── how it works ───────── */}
      <section id="how-it-works" aria-labelledby="partner-how-title" className="container-x scroll-mt-32 py-16 md:py-24">
        <div className="mb-10 max-w-2xl md:mb-14">
          <p className="eyebrow mb-3">How It Works</p>
          <h2 id="partner-how-title" className="h-section">
            Four simple steps
          </h2>
        </div>
        <NumberedSteps steps={STEPS} />
      </section>

      {/* ───────── benefits ───────── */}
      <section aria-labelledby="benefits-title" className="bg-porcelain py-16 md:py-24">
        <div className="container-x">
          <div className="mb-12 max-w-2xl">
            <p className="eyebrow mb-3">Why Partner With Us</p>
            <h2 id="benefits-title" className="h-section">
              Benefits that go beyond commission
            </h2>
          </div>
          <ul className="grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map(({ icon: Icon, t, d }, i) => (
              <li key={t}>
                <Reveal delay={(i % 3) * 0.08} className="border-t border-ink/80 pt-6">
                  <Icon className="h-6 w-6 text-gold" strokeWidth={1} aria-hidden />
                  <h3 className="mt-5 font-serif text-[1.6rem] leading-tight">{t}</h3>
                  <p className="mt-3 text-[16px] leading-relaxed text-taupe">{d}</p>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ───────── who it's for ───────── */}
      <section aria-labelledby="audience-title" className="container-x py-16 md:py-24">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <p className="eyebrow mb-3">Who It&apos;s For</p>
            <h2 id="audience-title" className="h-section">
              Made for people with a point of view
            </h2>
            <p className="mt-4 text-[17px] leading-relaxed text-taupe">If your recommendations matter to the people around you, we would love to hear from you.</p>
          </div>
          <ul className="grid gap-px border border-line bg-line sm:grid-cols-2 lg:col-span-8">
            {AUDIENCES.map(({ icon: Icon, t, d }) => (
              <li key={t} className="flex gap-5 bg-ivory p-6 sm:p-8">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line text-gold">
                  <Icon className="h-5 w-5" strokeWidth={1} aria-hidden />
                </span>
                <div>
                  <h3 className="font-serif text-xl">{t}</h3>
                  <p className="mt-1.5 text-[16px] leading-relaxed text-taupe">{d}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ───────── application ───────── */}
      <section id="apply" aria-labelledby="apply-title" className="scroll-mt-32 border-y border-line bg-white py-16 md:py-24">
        <div className="container-x grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <p className="eyebrow mb-3">Apply Now</p>
            <h2 id="apply-title" className="h-section">
              Join the program
            </h2>
            <p className="mt-4 text-[17px] leading-relaxed text-taupe">
              Tell us a little about yourself. We review every application personally and reply within five business days.
            </p>
            <ul className="mt-8 space-y-3 border-t border-line pt-6 text-[16px] text-charcoal">
              {['Free to join', 'No minimum sales', 'Dedicated partner manager'].map((x) => (
                <li key={x} className="flex items-center gap-3">
                  <span className="h-1.5 w-1.5 rotate-45 bg-gold" aria-hidden />
                  {x}
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-8">
            <PartnerForm brand={site.name} />
          </div>
        </div>
      </section>

      <FaqSection items={FAQS} title="Partner questions" />
    </>
  );
}
