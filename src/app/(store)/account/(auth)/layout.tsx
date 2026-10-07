import { JewelryArt } from '@/components/art/JewelryArt';
import { site } from '@/config/site';

/** Sign-in / registration: a focused form beside a quiet editorial panel (no account sidebar). */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container-x py-10 sm:py-16 lg:py-20">
      <div className="mx-auto grid max-w-6xl items-stretch gap-12 lg:grid-cols-2 lg:gap-20">
        <div className="mx-auto w-full max-w-md lg:mx-0 lg:py-6">{children}</div>
        <aside className="art-tile relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12" aria-hidden>
          <p className="eyebrow">Since {site.foundedYear}</p>
          <div className="mx-auto aspect-square w-[78%]">
            <JewelryArt spec={{ kind: 'ring', head: 'hidden-halo', band: 'pave' }} shape="oval" metal="yellow" carat={2} className="h-full w-full" />
          </div>
          <div>
            <p className="font-serif text-[28px] font-light leading-snug text-ink">“Made in our own workshop, for the moments you’ll want to remember.”</p>
            <p className="mt-4 text-[12px] uppercase tracking-[0.18em] text-taupe">The {site.name} Atelier</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
