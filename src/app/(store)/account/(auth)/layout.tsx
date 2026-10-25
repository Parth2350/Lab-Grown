import Image from 'next/image';
import { site } from '@/config/site';

/** Sign-in / registration: a focused form beside a quiet editorial panel (no account sidebar). */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container-x py-10 sm:py-16 lg:py-20">
      <div className="mx-auto grid max-w-6xl items-stretch gap-12 lg:grid-cols-2 lg:gap-20">
        <div className="mx-auto w-full max-w-md lg:mx-0 lg:py-6">{children}</div>
        <aside className="relative hidden min-h-[560px] overflow-hidden bg-porcelain lg:flex lg:flex-col lg:justify-between lg:p-12" aria-hidden>
          <Image src="/images/account/panel.webp" alt="" fill unoptimized className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-black/20" />
          <p className="eyebrow relative text-white">Since {site.foundedYear}</p>
          <div className="relative">
            <p className="font-serif text-[28px] font-light leading-snug text-white">“Made in our own workshop, for the moments you’ll want to remember.”</p>
            <p className="mt-4 text-[14px] uppercase tracking-[0.18em] text-white/80">{site.name} Atelier</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
