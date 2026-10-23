'use client';
import { Pause, Play } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * The hero film, filling its section edge to edge: portrait screens play the portrait cut, landscape screens the
 * landscape cut. With only one cut, screens of the other orientation show it whole over a soft blurred copy instead of
 * cropping it. Muted and looping, with a pause control; stays paused for visitors who prefer reduced motion.
 */
export function HeroFilm({ desktop, mobile, poster }: { desktop: string | null; mobile: string | null; poster?: string | null }) {
  const film = useRef<HTMLVideoElement>(null);
  const blur = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);
  const only = desktop && mobile ? null : (desktop ?? mobile);
  // the screen orientation that has no cut of its own
  const fit = !desktop ? 'landscape' : !mobile ? 'portrait' : null;

  const set = (play: boolean) =>
    [film.current, blur.current].forEach((v) => {
      if (!v) return;
      if (play) void v.play();
      else v.pause();
    });

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) set(false);
  }, []);

  return (
    <>
      {fit && (
        <video
          ref={blur}
          src={only!}
          autoPlay
          muted
          loop
          playsInline
          aria-hidden
          className={cn('absolute inset-0 h-full w-full scale-110 object-cover blur-2xl', fit === 'landscape' ? 'hidden landscape:block' : 'landscape:hidden')}
        />
      )}
      <video
        ref={film}
        src={only ?? undefined}
        poster={poster ?? undefined}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        className={cn('absolute inset-0 h-full w-full object-cover', fit === 'landscape' && 'landscape:object-contain', fit === 'portrait' && 'portrait:object-contain')}
      >
        {!only && (
          <>
            <source src={mobile!} media="(orientation: portrait)" />
            <source src={desktop!} />
          </>
        )}
      </video>
      <button
        type="button"
        onClick={() => set(!playing)}
        aria-label={playing ? 'Pause video' : 'Play video'}
        className="absolute bottom-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-ink/35 text-ivory backdrop-blur-sm transition-colors hover:bg-ink/60"
      >
        {playing ? <Pause className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden /> : <Play className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />}
      </button>
    </>
  );
}
