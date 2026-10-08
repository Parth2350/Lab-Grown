import { Crown, Earth, Gift, Laptop, Megaphone, PackageOpen } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { site } from '@/config/site';

const STEPS = [
  { title: 'Apply', text: 'Tell us about yourself and your audience in a short online application.' },
  { title: 'Get Approved', text: 'Our partnerships team personally reviews every application.' },
  { title: 'Share & Promote', text: 'Recommend the pieces you love with your personal referral link.' },
  { title: 'Earn Rewards', text: 'Receive commission on every completed order you refer.' },
];

const BENEFITS = [
  { icon: Gift, title: 'Exclusive Rewards', text: 'Competitive commission on every referred sale, with rewards that grow as you do.' },
  { icon: Earth, title: 'Global Opportunity', text: `Refer clients wherever we deliver — across ${site.stats.countries} countries and counting.` },
  { icon: PackageOpen, title: 'No Inventory Required', text: 'We handle stock, certification, insured shipping and aftercare. You simply share.' },
  { icon: Crown, title: 'Premium Jewelry Designs', text: 'Represent certified lab-grown diamond jewelry your audience will be proud to wear.' },
  { icon: Megaphone, title: 'Marketing Support', text: 'Campaign assets, product stories and tracked links, refreshed every season.' },
  { icon: Laptop, title: 'Work From Anywhere', text: 'Independent, flexible and entirely online — build it around your own schedule.' },
];

export function PartnerProgram() {
  return (
    <section aria-labelledby="partner-title" className="py-16 md:py-24">
      <div className="container-x grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
        <Reveal className="lg:col-span-5">
          <p className="eyebrow mb-4 flex items-center gap-3">
            <span className="h-px w-8 bg-gold" aria-hidden />
            Sales Partner Program
          </p>
          <h2 id="partner-title" className="h-section">{`Partner With ${site.name}`}</h2>
          <p className="mt-6 max-w-lg text-[17px] leading-relaxed text-charcoal/85 sm:text-base">
            Love fine jewelry and know people who do? Our partner program lets stylists, creators, wedding planners and jewelry lovers recommend {site.name} and earn
            rewards on every sale — while we take care of the craftsmanship, certification and delivery.
          </p>
          <ButtonLink href="/partner-program" size="lg" className="mt-9 w-full sm:w-auto">
            Apply Now
          </ButtonLink>
        </Reveal>

        <div className="lg:col-span-7">
          <Reveal delay={0.05}>
            <h3 className="label-caps mb-6 font-sans text-taupe">How it works</h3>
            <ol className="relative grid gap-6 sm:grid-cols-4 sm:gap-4">
              <span className="absolute left-5 top-5 hidden h-px w-[calc(100%-2.5rem)] bg-line sm:block" aria-hidden />
              {STEPS.map((step, i) => (
                <li key={step.title} className="relative flex gap-4 sm:block">
                  <span className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold/60 bg-ivory font-serif text-lg text-gold-deep">
                    {i + 1}
                  </span>
                  <div className="sm:mt-5">
                    <p className="font-serif text-[1.3rem] leading-tight text-ink">{step.title}</p>
                    <p className="mt-1.5 text-[15.5px] leading-relaxed text-taupe">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Reveal>

          <h3 className="label-caps mb-6 mt-14 font-sans text-taupe">Why partner with us</h3>
          <ul className="grid border-l border-t border-line sm:grid-cols-2 xl:grid-cols-3">
            {BENEFITS.map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="border-b border-r border-line">
                <Reveal delay={i * 0.05} y={12} className="group flex h-full gap-4 p-5 transition-colors duration-500 hover:bg-porcelain/70 sm:block sm:p-6">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-gold" strokeWidth={1.1} aria-hidden />
                  <div>
                    <p className="font-serif text-[1.2rem] leading-tight text-ink sm:mt-4">{title}</p>
                    <p className="mt-1.5 text-[15.5px] leading-relaxed text-taupe">{text}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
