import { facetPaths, SHAPE_ASPECT } from '@/components/art/geometry';
import { site } from '@/config/site';

export const OG_SIZE = { width: 1200, height: 630 };

/** Static diamond line drawing (no hooks) that Satori / ImageResponse can render. */
export function OgDiamond({ shape = 'round', size = 360 }: { shape?: string; size?: number }) {
  const aspect = SHAPE_ASPECT[shape] ?? 1;
  const h = 84;
  const w = Math.min(84, h / aspect);
  const f = facetPaths(shape, w, w * aspect);
  return (
    <svg width={size} height={size} viewBox="-50 -50 100 100" fill="none" stroke="#A8834A" strokeLinejoin="round">
      <path d={f.outline} strokeWidth={1.1} fill="#FFFFFF" fillOpacity={0.6} />
      <path d={f.light} fill="#FFFFFF" stroke="none" />
      <path d={f.lines} strokeWidth={0.5} opacity={0.85} />
    </svg>
  );
}

export function OgFrame({ eyebrow, title, subtitle, shape }: { eyebrow: string; title: string; subtitle?: string; shape?: string }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        background: 'radial-gradient(120% 90% at 70% 40%, #FDFAF4 0%, #F2E9DA 60%, #E7DBC6 100%)',
        padding: '64px 72px',
        fontFamily: 'serif',
        color: '#141311',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1 }}>
        <div style={{ display: 'flex', fontSize: 30, letterSpacing: 12, textTransform: 'uppercase' }}>{site.name}</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 20, letterSpacing: 6, textTransform: 'uppercase', color: '#77706A', marginBottom: 18 }}>{eyebrow}</div>
          <div style={{ display: 'flex', fontSize: title.length > 40 ? 58 : 70, lineHeight: 1.05, maxWidth: 640 }}>{title}</div>
          {subtitle && <div style={{ display: 'flex', fontSize: 28, color: '#86662F', marginTop: 22 }}>{subtitle}</div>}
        </div>
        <div style={{ display: 'flex', fontSize: 16, letterSpacing: 3, textTransform: 'uppercase', color: '#77706A' }}>IGI & GIA certified · Made in-house</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 420 }}>
        <OgDiamond shape={shape} size={400} />
      </div>
    </div>
  );
}
