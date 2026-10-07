import Link from 'next/link';
import { Search, Star } from 'lucide-react';
import { pageMeta } from '@/lib/seo';
import { requireAdmin } from '@/lib/server/auth';
import { cleanParams, pageCount, paging, sp, spEnum, spNumber, type SearchParams } from '@/lib/server/admin/list';
import { listReviews, REVIEW_TABS, type ReviewTab } from '@/lib/server/admin/queries/reviews';
import { ReviewQueue, type ReviewItem } from '@/components/admin/reviews/ReviewQueue';
import { AutoSubmitSelect } from '@/components/admin/forms';
import { Button } from '@/components/ui/Button';
import { EmptyState, FilterBar, FilterLabel, PageHeader, Pagination, Tabs, fieldSm, selectChevron, selectSm, withParams } from '@/components/admin/ui';

export const metadata = pageMeta({ title: 'Reviews', path: '/admin/reviews', noIndex: true });

const PAGE_SIZE = 25;

const TAB_LABEL: Record<ReviewTab, string> = { PENDING: 'Pending', APPROVED: 'Approved', REJECTED: 'Rejected', all: 'All' };

const EMPTY: Record<ReviewTab, { title: string; description: string }> = {
  PENDING: { title: 'All caught up', description: 'No reviews are waiting for moderation. New reviews from customers will appear here.' },
  APPROVED: { title: 'No approved reviews', description: 'Approved reviews appear on product pages and count toward star ratings.' },
  REJECTED: { title: 'No rejected reviews', description: 'Reviews you reject are kept here, hidden from the storefront.' },
  all: { title: 'No reviews yet', description: 'Customer reviews will appear here as soon as they are submitted.' },
};

export default async function ReviewsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin();
  const params = await searchParams;
  const status = spEnum(params, 'status', REVIEW_TABS, 'PENDING');
  const q = sp(params, 'q').slice(0, 100);
  const ratingParam = spNumber(params, 'rating');
  const rating = ratingParam && Number.isInteger(ratingParam) && ratingParam >= 1 && ratingParam <= 5 ? ratingParam : undefined;
  const { page, pageSize, skip, take } = paging(params, PAGE_SIZE);

  const { rows, counts, total } = await listReviews({ status, q, rating, skip, take });
  const current = cleanParams(params);
  const filtered = Boolean(q || rating);

  const items: ReviewItem[] = rows.map((r) => ({
    id: r.id,
    rating: r.rating,
    title: r.title,
    body: r.body,
    authorName: r.authorName,
    location: r.location,
    isVerified: r.isVerified,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    productId: r.productId,
    product: { name: r.product.name, slug: r.product.slug },
  }));

  const clearHref = status === 'PENDING' ? '/admin/reviews' : `/admin/reviews?status=${status}`;

  return (
    <>
      <PageHeader
        title="Reviews"
        description="Moderate customer reviews. Approved reviews appear on product pages and drive each product’s star rating and review count."
      />

      <Tabs tabs={REVIEW_TABS.map((t) => ({ value: t, label: TAB_LABEL[t], count: counts[t] }))} active={status} basePath="/admin/reviews" params={current} />

      <FilterBar action="/admin/reviews">
        <input type="hidden" name="status" value={status} />
        <div className="w-full sm:w-72">
          <FilterLabel htmlFor="reviews-q">Search</FilterLabel>
          <input id="reviews-q" type="search" name="q" defaultValue={q} maxLength={100} placeholder="Author, title, text or product" className={fieldSm} />
        </div>
        <div>
          <FilterLabel htmlFor="reviews-rating">Rating</FilterLabel>
          <AutoSubmitSelect id="reviews-rating" name="rating" defaultValue={rating ? String(rating) : ''} className={selectSm} style={selectChevron}>
            <option value="">All ratings</option>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} star{n === 1 ? '' : 's'}
              </option>
            ))}
          </AutoSubmitSelect>
        </div>
        <Button type="submit" size="sm" variant="outline">
          <Search className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
          Filter
        </Button>
        {filtered && (
          <Link href={clearHref} className="inline-flex h-9 items-center px-2 text-xs text-taupe underline-offset-4 hover:text-ink hover:underline">
            Clear filters
          </Link>
        )}
      </FilterBar>

      {items.length === 0 ? (
        <div className="border border-line bg-white">
          {total > 0 ? (
            <EmptyState
              title="Nothing on this page"
              description="This page is past the end of the list."
              action={
                <Link href={withParams('/admin/reviews', current, {})} className="text-xs text-ink underline underline-offset-4">
                  Go to the first page
                </Link>
              }
            />
          ) : filtered ? (
            <EmptyState
              icon={<Search className="h-5 w-5" strokeWidth={1.25} />}
              title="No reviews match"
              description="Try a different search term or rating."
              action={
                <Link href={clearHref} className="text-xs text-ink underline underline-offset-4">
                  Clear filters
                </Link>
              }
            />
          ) : (
            <EmptyState icon={<Star className="h-5 w-5" strokeWidth={1.25} />} title={EMPTY[status].title} description={EMPTY[status].description} />
          )}
        </div>
      ) : (
        <ReviewQueue reviews={items} />
      )}

      <Pagination page={page} pageCount={pageCount(total, pageSize)} total={total} pageSize={pageSize} basePath="/admin/reviews" params={current} noun="reviews" />
    </>
  );
}
