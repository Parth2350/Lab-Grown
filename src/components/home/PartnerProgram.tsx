import Image from 'next/image';
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
  { icon: Gift, title: 'Exclusive Rewards Program' },
  { icon: Earth, title: 'Global Opportunity' },
  { icon: PackageOpen, title: 'No Inventory Required' },
  { icon: Crown, title: 'Access to Premium Jewelry Designs' },
  { icon: Megaphone, title: 'Marketing Support' },
  { icon: Laptop, title: 'Work From Anywhere' },
];

export function PartnerProgram() {
  return (
    <section aria-labelledby="partner-title" className="py-16 md:py-24">
      <div className="container-x grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-6">
          <Reveal>
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

          <Reveal delay={0.05}>
            <h3 className="label-caps mb-6 mt-14 font-sans text-taupe">How it works</h3>
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
        </div>

        {/* photo with the benefits card overlapping its lower edge */}
        <Reveal delay={0.1} className="lg:col-span-6">
          <div className="relative overflow-hidden rounded-2xl shadow-lift">
            <Image
              src="/images/home/partner.webp"
              alt={`A ${site.name} partner shaking hands over a ring box and order form`}
              width={1600}
              height={893}
              sizes="(min-width:1024px) 50vw, 100vw"
              className="aspect-[3/2] h-auto w-full object-cover"
            />
          </div>
          <ul className="relative z-10 mx-3 -mt-10 grid grid-cols-2 gap-x-3 gap-y-5 rounded-xl border border-line bg-white p-5 shadow-soft sm:mx-8 sm:-mt-16 sm:grid-cols-3 sm:p-6">
            {BENEFITS.map(({ icon: Icon, title }) => (
              <li key={title} className="flex flex-col items-center text-center">
                <Icon className="h-6 w-6 text-gold" strokeWidth={1.1} aria-hidden />
                <p className="mt-2 text-[13.5px] leading-snug text-ink">{title}</p>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
