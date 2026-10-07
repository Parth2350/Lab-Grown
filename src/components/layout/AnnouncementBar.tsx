import { LogoMark } from './Logo';

/** Slow, continuous marquee of brand promises. Pure CSS — pauses on hover, static for reduced motion. */
export function AnnouncementBar({ messages }: { messages: string[] }) {
  if (!messages.length) return null;
  const row = [...messages, ...messages];
  return (
    <div className="group relative overflow-hidden border-b border-line bg-porcelain text-charcoal" aria-label="Store announcements">
      <ul className="flex w-max animate-marquee items-center py-2.5 group-hover:[animation-play-state:paused]">
        {[...row, ...row].map((m, i) => (
          <li key={i} className="flex items-center whitespace-nowrap px-6 text-[10.5px] font-medium uppercase tracking-[0.22em] sm:px-9" aria-hidden={i >= messages.length}>
            <LogoMark className="mr-6 h-2.5 w-2.5 text-gold sm:mr-9" />
            {m}
          </li>
        ))}
      </ul>
    </div>
  );
}
