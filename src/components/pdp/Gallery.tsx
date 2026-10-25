'use client';
import Image from 'next/image';
import { AnimatePresence, m } from 'framer-motion';
import { ChevronLeft, ChevronRight, Expand, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { JewelryArt, type ArtSpec } from '@/components/art/JewelryArt';
import type { MediaImage } from '@/lib/types';
import { cn } from '@/lib/utils';
import { catalogSrc, isCatalogMedia } from '@/lib/catalog';
import { useMounted } from '@/hooks/use-mounted';
import { LazyMount } from '@/components/ui/LazyMount';

type Slide = {
  id: string;
  label: string;
  kind: 'art' | 'image' | 'video';
  view?: number;
  zoom?: number;
  url?: string;
  alt?: string;
};

type Props = {
  name: string;
  art: ArtSpec | null;
  images: MediaImage[];
  metal: string;
  shape: string;
  carat: number;
  compact?: boolean;
};

function buildSlides(images: MediaImage[], metal: string, shape: string, name: string): Slide[] {
  // catalogue photos are shot per metal and per diamond shape: show the selected combination
  const byShape = images.some((i) => i.shape === shape) ? images.filter((i) => !i.shape || i.shape === shape) : images;
  const media = byShape.filter((i) => !i.metalColor || i.metalColor === metal);
  const pool = media.length ? media : byShape.length ? byShape : images;
  if (pool.length) {
    return pool.map((m, i) => ({
      id: `m${i}`,
      label: m.kind === 'video' ? 'Video' : `Photo ${i + 1}`,
      kind: (m.kind === 'video' ? 'video' : 'image') as Slide['kind'],
      url: m.url,
      alt: m.alt ?? name,
    }));
  }
  return [
    { id: 'a0', label: 'Top view', kind: 'art', view: 0 },
    { id: 'a1', label: 'Profile', kind: 'art', view: 1 },
    { id: 'a2', label: 'Detail', kind: 'art', view: 0, zoom: 1.7 },
  ];
}

function SlideView({ s, art, metal, shape, carat, name, sizes, priority }: { s: Slide; art: ArtSpec | null; metal: string; shape: string; carat: number; name: string; sizes: string; priority?: boolean }) {
  if (s.kind === 'image') return <Image src={catalogSrc(s.url!)} alt={s.alt ?? name} fill sizes={sizes} priority={priority} unoptimized={isCatalogMedia(s.url)} className="object-cover" />;
  if (s.kind === 'video') return <video src={s.url} className="h-full w-full object-cover" autoPlay muted loop playsInline controls aria-label={`${name} video`} />;
  return (
    <div className="absolute inset-[6%]" style={s.zoom ? { transform: `scale(${s.zoom})` } : undefined}>
      <JewelryArt spec={art ?? { kind: 'ring' }} shape={shape} metal={metal} carat={carat} view={s.view} title={`${name} — ${s.label}`} className="h-full w-full" />
    </div>
  );
}

export function Gallery({ name, art, images, metal, shape, carat, compact }: Props) {
  const slides = buildSlides(images, metal, shape, name);
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState<{ i: number; x: number; y: number } | null>(null);
  const [full, setFull] = useState(false);
  const track = useRef<HTMLDivElement>(null);
  const mounted = useMounted();
  const current = slides[Math.min(index, slides.length - 1)];
  const sizes = '(min-width:1024px) 40vw, 90vw';

  const go = useCallback((i: number) => setIndex((i + slides.length) % slides.length), [slides.length]);

  useEffect(() => {
    if (!full) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFull(false);
      if (e.key === 'ArrowRight') go(index + 1);
      if (e.key === 'ArrowLeft') go(index - 1);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [full, go, index]);

  // mobile swipe track keeps the active index in sync
  const onScroll = () => {
    const el = track.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== index) setIndex(i);
  };

  const openAt = (i: number) => {
    setIndex(i);
    setFull(true);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* every view at once, two per row — tablet & desktop product page */}
      {!compact && (
        <div className="hidden grid-cols-2 gap-2 md:grid" aria-label="Product views">
          {slides.map((s, i) => (
            <div
              key={s.id}
              className={cn('art-tile relative aspect-square overflow-hidden', slides.length % 2 === 1 && i === 0 && 'col-span-2', s.kind !== 'video' && 'cursor-zoom-in')}
              onMouseMove={(e) => {
                if (s.kind === 'video') return;
                const r = e.currentTarget.getBoundingClientRect();
                setZoom({
                  i,
                  x: ((e.clientX - r.left) / r.width) * 100,
                  y: ((e.clientY - r.top) / r.height) * 100,
                });
              }}
              onMouseLeave={() => setZoom(null)}
              onClick={() => s.kind !== 'video' && openAt(i)}
            >
              <div
                key={metal}
                className="absolute inset-0 transition-transform duration-100 ease-out"
                style={
                  zoom?.i === i
                    ? {
                        transform: 'scale(2)',
                        transformOrigin: `${zoom.x}% ${zoom.y}%`,
                      }
                    : undefined
                }
              >
                <LazyMount eager={i < 2} className="absolute inset-0">
                  <SlideView
                    s={s}
                    art={art}
                    metal={metal}
                    shape={shape}
                    carat={carat}
                    name={name}
                    sizes={slides.length % 2 === 1 && i === 0 ? '(min-width:1024px) 58vw, 100vw' : '(min-width:1024px) 29vw, 50vw'}
                    priority={i === 0}
                  />
                </LazyMount>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* main stage — quick view */}
      {compact && (
        <div className="art-tile relative aspect-square flex-1 overflow-hidden">
          <div className={cn('absolute inset-0', current.kind !== 'video' && 'cursor-zoom-in')} onClick={() => current.kind !== 'video' && setFull(true)}>
            <AnimatePresence mode="wait" initial={false}>
              <m.div key={`${current.id}-${metal}`} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
                <SlideView s={current} art={art} metal={metal} shape={shape} carat={carat} name={name} sizes={sizes} priority />
              </m.div>
            </AnimatePresence>
          </div>
          {current.kind !== 'video' && (
            <button
              onClick={() => setFull(true)}
              className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-ivory/90 text-ink transition-colors hover:bg-ink hover:text-ivory"
              aria-label="Open fullscreen"
            >
              <Expand className="h-4 w-4" strokeWidth={1.25} />
            </button>
          )}
          <div className="absolute bottom-3 right-3 flex gap-1">
            <button onClick={() => go(index - 1)} className="flex h-9 w-9 items-center justify-center rounded-full bg-ivory/90 hover:bg-ivory" aria-label="Previous image">
              <ChevronLeft className="h-4 w-4" strokeWidth={1.25} />
            </button>
            <button onClick={() => go(index + 1)} className="flex h-9 w-9 items-center justify-center rounded-full bg-ivory/90 hover:bg-ivory" aria-label="Next image">
              <ChevronRight className="h-4 w-4" strokeWidth={1.25} />
            </button>
          </div>
        </div>
      )}

      {/* swipeable stage — mobile */}
      {!compact && (
        <div className="relative md:hidden">
          <div ref={track} onScroll={onScroll} className="no-scrollbar -mx-4 flex snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain sm:-mx-6">
            {slides.map((s, i) => (
              <div key={s.id} className="art-tile relative aspect-square w-full shrink-0 snap-center" onClick={() => setFull(true)}>
                <LazyMount eager={i === 0} rootMargin="0px 200px" className="absolute inset-0">
                  <SlideView s={s} art={art} metal={metal} shape={shape} carat={carat} name={name} sizes="100vw" priority={i === 0} />
                </LazyMount>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-center gap-0.5">
            {slides.map((s, i) => (
              <button
                key={s.id}
                aria-label={`Show ${s.label}`}
                onClick={() => {
                  track.current?.scrollTo({
                    left: i * (track.current?.clientWidth ?? 0),
                    behavior: 'smooth',
                  });
                  setIndex(i);
                }}
                className="flex h-6 min-w-6 items-center justify-center px-1"
              >
                <span className={cn('h-1.5 rounded-full transition-all', i === index ? 'w-6 bg-ink' : 'w-1.5 bg-stone')} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* thumbnails */}
      {compact && (
        <ul className="no-scrollbar flex gap-2 overflow-x-auto" aria-label="Product views">
          {slides.map((s, i) => (
            <li key={s.id} className="shrink-0">
              <button
                onClick={() => setIndex(i)}
                aria-label={s.label}
                aria-current={i === index}
                className={cn('art-tile relative block h-16 w-16 overflow-hidden border transition-colors lg:h-20 lg:w-20', i === index ? 'border-ink' : 'border-transparent hover:border-stone')}
              >
                {s.kind === 'video' ? (
                  <span className="flex h-full w-full items-center justify-center text-[12px] uppercase tracking-[0.12em] text-taupe">Video</span>
                ) : (
                  <LazyMount className="absolute inset-0">
                    <SlideView s={s} art={art} metal={metal} shape={shape} carat={carat} name={name} sizes="80px" />
                  </LazyMount>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {mounted &&
        createPortal(
          <AnimatePresence>
            {full && (
              <m.div
                className="fixed inset-0 z-[95] flex flex-col bg-ivory"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                role="dialog"
                aria-modal="true"
                aria-label={`${name} — fullscreen gallery`}
              >
                <div className="flex items-center justify-between px-5 py-4">
                  <p className="font-serif text-lg">{name}</p>
                  <button onClick={() => setFull(false)} className="rounded-full p-2 hover:bg-porcelain" aria-label="Close fullscreen" autoFocus>
                    <X className="h-6 w-6" strokeWidth={1.25} />
                  </button>
                </div>
                <div className="art-tile relative mx-auto aspect-square w-full max-w-[min(88vh,100vw)] flex-1">
                  <SlideView s={current} art={art} metal={metal} shape={shape} carat={carat} name={name} sizes="100vw" />
                  <button onClick={() => go(index - 1)} className="absolute left-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-ivory shadow-soft" aria-label="Previous">
                    <ChevronLeft className="h-5 w-5" strokeWidth={1.25} />
                  </button>
                  <button onClick={() => go(index + 1)} className="absolute right-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-ivory shadow-soft" aria-label="Next">
                    <ChevronRight className="h-5 w-5" strokeWidth={1.25} />
                  </button>
                </div>
                <p className="py-4 text-center text-[13px] uppercase tracking-[0.18em] text-taupe">
                  {current.label} · {index + 1} / {slides.length}
                </p>
              </m.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}
