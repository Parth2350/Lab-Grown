'use client';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { m, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { EditorialArt, type EditorialScene } from '@/components/art/EditorialArt';
import { LazyMount } from '@/components/ui/LazyMount';
import { cn } from '@/lib/utils';

const STEPS: { title: string; scene: EditorialScene; text: string }[] = [
  {
    title: 'Concept & Design',
    scene: 'sketch',
    text: 'Every piece begins as a pencil sketch at our design table — proportion, profile and the path light will take through the stone, refined until it feels inevitable.',
  },
  {
    title: 'CAD Modeling',
    scene: 'cad',
    text: 'The sketch becomes a precise 3D model, engineered to a hundredth of a millimetre so every claw, gallery and shoulder is balanced before metal is cast.',
  },
  {
    title: 'Expert Setting',
    scene: 'setting',
    text: 'Under magnification, our master setters seat each diamond by hand, tightening every claw until the stone sits secure and perfectly level.',
  },
  {
    title: 'Quality Inspection',
    scene: 'inspection',
    text: 'Each piece is examined under the loupe — stone security, symmetry, finish and fit — before it is allowed to carry our hallmark.',
  },
  {
    title: 'Finishing & Polishing',
    scene: 'polishing',
    text: 'Hours of hand polishing bring the gold to a flawless mirror finish, even inside the band and beneath the stone, where few will ever look.',
  },
  {
    title: 'Luxury Packaging',
    scene: 'packaging',
    text: 'Your piece is presented in our signature box with its diamond certificate and care guide, then insured all the way to your door.',
  },
];

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * "From Rough Stone to Heirloom". On large, tall-enough screens the section pins and
 * vertical scrolling drives a horizontal journey through the six steps (page scroll is
 * never captured — the section is simply taller). Everywhere else — small screens,
 * reduced motion, before hydration — it is a plain vertical list / native scroll row.
 */
export function ProcessStory() {
  const section = useRef<HTMLElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLOListElement>(null);
  const reduce = useReducedMotion();
  const [pinned, setPinned] = useState(false);
  const [distance, setDistance] = useState(0);
  const [active, setActive] = useState(0);
  const dist = useMotionValue(0);

  const { scrollYProgress } = useScroll({ target: section, offset: ['start start', 'end end'] });
  const x = useTransform([scrollYProgress, dist], ([p, d]) => -(p as number) * (d as number));

  useEffect(() => {
    if (reduce) {
      setPinned(false);
      return;
    }
    const mq = window.matchMedia('(min-width: 1024px) and (min-height: 640px)');
    const measure = () => {
      const can = mq.matches;
      setPinned(can);
      // the row layout only exists once pinned; the ResizeObserver re-measures after the switch
      if (!can || !track.current || !frame.current || getComputedStyle(track.current).display !== 'flex') return;
      const cs = getComputedStyle(frame.current);
      const inner = frame.current.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      const d = Math.max(0, Math.ceil(track.current.scrollWidth - inner));
      setDistance(d);
      dist.set(d);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (track.current) ro.observe(track.current);
    mq.addEventListener('change', measure);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      mq.removeEventListener('change', measure);
      window.removeEventListener('resize', measure);
    };
  }, [reduce, dist]);

  useMotionValueEvent(scrollYProgress, 'change', (p) => {
    if (!pinned) return;
    const i = Math.min(STEPS.length - 1, Math.max(0, Math.round(p * (STEPS.length - 1))));
    setActive((prev) => (prev === i ? prev : i));
  });

  return (
    <section
      ref={section}
      aria-labelledby="process-title"
      className="relative border-y border-line bg-ivory"
      style={pinned ? { height: `calc(100vh + ${distance}px)` } : undefined}
    >
      <div className={cn(pinned ? 'sticky top-0 flex h-screen flex-col justify-center overflow-hidden pb-8 pt-20 xl:pt-28' : 'py-16 md:py-24')}>
        <div className="container-x mb-8 flex flex-col gap-6 md:mb-12 lg:mb-10 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <p className="eyebrow mb-3 flex items-center gap-3">
              <span className="h-px w-8 bg-gold" aria-hidden />
              The Making Of
            </p>
            <h2 id="process-title" className="h-section">
              From Rough Stone to Heirloom
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-taupe">Six stages, one roof. Follow a piece from the first line on paper to the moment it reaches you.</p>
          </div>
          <div className="flex flex-col gap-4 lg:w-[340px] lg:items-end">
            {pinned && (
              <div className="w-full" aria-hidden>
                <div className="mb-3 flex items-baseline justify-between gap-4">
                  <span className="font-serif text-2xl text-ink">
                    {pad(active + 1)} <span className="text-base text-taupe">/ {pad(STEPS.length)}</span>
                  </span>
                  <span className="label-caps truncate text-taupe">{STEPS[active].title}</span>
                </div>
                <div className="relative h-px w-full bg-line">
                  <m.div className="absolute inset-0 origin-left bg-gold" style={{ scaleX: scrollYProgress }} />
                </div>
              </div>
            )}
            <Link href="/pages/manufacturing" className="label-caps group inline-flex items-center gap-2 text-ink">
              <span className="link-underline group-hover:[background-size:100%_1px]">Inside our workshop</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={1.5} aria-hidden />
            </Link>
          </div>
        </div>

        <div ref={frame} className="container-x">
          <m.ol
            ref={track}
            style={pinned ? { x } : undefined}
            className={cn('grid gap-x-5 gap-y-10 sm:grid-cols-2', pinned ? 'flex w-max gap-6 xl:gap-8' : 'lg:grid-cols-3 lg:gap-x-8 lg:gap-y-14')}
          >
            {STEPS.map((step, i) => (
              <li
                key={step.title}
                className={cn('group', pinned && 'w-[min(400px,30vw,46vh)] shrink-0 transition-opacity duration-700', pinned && i !== active && 'opacity-60')}
              >
                <div className="art-tile relative aspect-[4/3] overflow-hidden">
                  <LazyMount className="absolute inset-0 block" rootMargin="600px">
                    <EditorialArt scene={step.scene} decorative className="transition-transform duration-[1400ms] ease-luxe group-hover:scale-[1.03]" />
                  </LazyMount>
                </div>
                <div className="mt-5 flex gap-4">
                  <span className="font-serif text-[2rem] font-light leading-none text-gold">{pad(i + 1)}</span>
                  <div>
                    <h3 className="font-serif text-[1.45rem] leading-tight text-ink">{step.title}</h3>
                    <p className="mt-2 text-[14px] leading-relaxed text-taupe">{step.text}</p>
                  </div>
                </div>
              </li>
            ))}
          </m.ol>
        </div>
      </div>
    </section>
  );
}
