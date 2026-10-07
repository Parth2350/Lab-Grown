import Link from 'next/link';
import { ButtonLink } from '@/components/ui/Button';
import { ShapeIcon } from '@/components/art/ShapeIcon';

export default function NotFound() {
  return (
    <section className="container-x grid items-center gap-10 py-20 md:grid-cols-2 md:py-28">
      <div className="art-tile-warm mx-auto flex aspect-square w-full max-w-sm items-center justify-center">
        <ShapeIcon shape="pear" size={180} strokeWidth={0.8} className="text-gold" />
      </div>
      <div>
        <p className="eyebrow mb-4">Error 404</p>
        <h1 className="h-section">This page has gone missing</h1>
        <p className="mt-4 max-w-md text-taupe">The piece or page you were looking for may have moved or sold out. Let us help you find something just as beautiful.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/collections/all">Shop All Jewelry</ButtonLink>
          <ButtonLink href="/engagement-rings" variant="outline">
            Engagement Rings
          </ButtonLink>
        </div>
        <p className="mt-8 text-sm text-taupe">
          Or <Link href="/contact" className="underline underline-offset-4 hover:text-ink">speak to our concierge</Link>.
        </p>
      </div>
    </section>
  );
}
