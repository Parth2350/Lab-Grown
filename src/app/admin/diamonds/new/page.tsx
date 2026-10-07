import { pageMeta } from '@/lib/seo';
import { requireAdmin } from '@/lib/server/auth';
import { sp, type SearchParams } from '@/lib/server/admin/list';
import { getAdminDiamond, suggestDiamondSku } from '@/lib/server/admin/queries/diamonds';
import { DiamondForm, type DiamondFormValues } from '@/components/admin/diamonds/DiamondForm';
import { PageHeader } from '@/components/admin/ui';

export const metadata = pageMeta({ title: 'Add diamond', path: '/admin/diamonds/new', noIndex: true });

export default async function NewDiamondPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin();
  const params = await searchParams;
  const fromId = sp(params, 'from');
  const [source, suggestedSku] = await Promise.all([fromId ? getAdminDiamond(fromId) : null, suggestDiamondSku()]);

  const values: DiamondFormValues = source
    ? {
        sku: suggestedSku,
        shape: source.shape,
        carat: source.carat,
        color: source.color,
        clarity: source.clarity,
        cut: source.cut,
        polish: source.polish,
        symmetry: source.symmetry,
        fluorescence: source.fluorescence,
        measurements: source.measurements,
        tablePct: source.tablePct,
        depthPct: source.depthPct,
        ratio: source.ratio,
        growth: source.growth,
        price: source.price,
        isAvailable: true,
        certLab: source.certificate?.lab ?? 'IGI',
        certNumber: '',
        certUrl: '',
        certIssuedAt: null,
      }
    : {
        sku: suggestedSku,
        shape: 'round',
        carat: null,
        color: 'F',
        clarity: 'VS1',
        cut: 'Ideal',
        polish: 'Excellent',
        symmetry: 'Excellent',
        fluorescence: 'None',
        measurements: null,
        tablePct: null,
        depthPct: null,
        ratio: null,
        growth: 'CVD',
        price: null,
        isAvailable: true,
        certLab: 'IGI',
        certNumber: '',
        certUrl: '',
        certIssuedAt: null,
      };

  return (
    <>
      <PageHeader
        eyebrow="Diamond inventory"
        title={source ? `Duplicate ${source.sku}` : 'Add diamond'}
        description="Every stone needs a unique SKU. Certified stones should carry their lab report number so customers can verify them."
        back={{ href: '/admin/diamonds', label: 'Diamonds' }}
      />
      <div className="max-w-4xl">
        <DiamondForm diamond={values} mode="create" duplicateOf={source?.sku} />
      </div>
    </>
  );
}
