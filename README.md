# The V Jewels — Lab-Grown Diamond Fine Jewelry

A production-grade luxury jewelry storefront and admin, built with **Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS · PostgreSQL · Prisma · NextAuth · Zustand · Framer Motion**.

Brand name, contact details and copy live in `src/config/site.ts`; logo files (cut from the master artwork, transparent PNGs in dark and light versions) are in `public/brand/`, and the favicon / app icons in `src/app/`.

---

## Quick start

```bash
npm install
cp .env.example .env            # then set NEXTAUTH_SECRET (any long random string)
npm run db:start                # terminal 1 — embedded PostgreSQL on :5433 (no install needed)
npx prisma migrate deploy       # terminal 2 — create the schema
npm run db:seed                 # demo catalog, diamonds, customers, orders, reviews…
npm run dev                     # http://localhost:3000
```

`npm run db:start` launches a real PostgreSQL server from the `embedded-postgres` package and keeps its data in `~/.aurevia/pgdata` (outside synced folders such as OneDrive). Already have PostgreSQL? Skip that step and point `DATABASE_URL` at it.

### Demo logins

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@aurevia.example` | `Aurevia@Admin1` |
| Customer | `demo@aurevia.example` | `Aurevia@Demo1` |

Change or remove these before going live (`prisma/seed.ts`).

### Coupons in the seed

`WELCOME10` (10% off) · `LUXE150` (₹14,500 off orders over ₹1,40,000) · `BRIDAL15` (15% off over ₹1,90,000) · `SUMMER20` (expired — shows the error state).

---

## Configuration

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_URL`, `NEXTAUTH_SECRET` | Auth.js / NextAuth session signing |
| `GOOGLE_CLIENT_ID/SECRET` | Optional Google sign-in |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Live/test payments (UPI, cards, net banking, wallets). **Blank = built-in demo payment flow, no charges.** |
| `CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET` | Product, hero and bespoke image uploads. Blank = files saved to `public/uploads`. Any S3-compatible store can be swapped in at `src/lib/server/storage.ts`. |
| `REDIS_URL` | Optional shared cache for API responses (falls back to in-memory) |
| `NEXT_PUBLIC_SITE_URL` | Canonical URLs, sitemap and Open Graph |
| `RAZORPAY_WEBHOOK_SECRET` | Verifies Razorpay webhooks at `/api/payments/razorpay/webhook` (`payment.captured`, `order.paid`) |
| `NEXT_PUBLIC_DEMO_MODE` | `false` hides the demo-login hint on the sign-in page |

---

## What's inside

**Storefront** — sticky header with mega-menus, search overlay (recent + popular searches, live results across products, categories, collections and shapes), cart drawer, account menu, mobile navigation, marquee announcement bar, editorial homepage, collection pages with faceted filtering (price, metal type, purity, shape, centre and total carat, setting, style, collection), smart search ("2ct oval halo", SKUs), sort, load-more and infinite scroll, mobile bottom-sheet filters.

**Product pages** — gallery with hover zoom, fullscreen, swipe and video support; live pricing as purity, metal colour, diamond and ring size change; a **three-step centre-diamond chooser** (shape → carat size → Good / Better / Best quality) that picks the best-value certified stone automatically, with a full loose-diamond search (carat, colour, clarity, cut, lab, price) for shoppers who want a specific stone; quick view; wishlist, compare, share; reviews with moderation; related and recently viewed products.

**Commerce** — persistent cart and wishlist (localStorage, synced to the database when signed in), compare up to four pieces, coupon codes, server-side re-pricing of every line at checkout, Razorpay (or demo) payments, stock and diamond allocation on payment, order confirmation.

**Account** — profile, orders and order detail with tracking, saved addresses, wishlist, compare, recently viewed, returns and support.

**Content** — lab-grown diamond education, about, contact, bespoke multi-step inquiry with image upload, partner program application, gift guide, Find Your Match quiz with recommendations, policy pages, FAQ.

**Admin (`/admin`)** — dashboard KPIs and charts, products (variants, diamond options, imagery, SEO), categories, collections, orders, customers, diamonds, inventory, coupons, reviews, bespoke requests, partner applications, payments, shipping, analytics, messages and store settings. Every admin write revalidates the storefront cache, so changes appear immediately.

### Imagery

There is no stock photography. Every product is rendered by an original **procedural SVG renderer** (`src/components/art/JewelryArt.tsx`) that redraws instantly in the selected metal colour, diamond shape and carat. Uploading photos for a product in the admin automatically replaces the illustration (served through `next/image` as AVIF/WebP).

---

## Architecture

```
prisma/                 schema, migrations, seed + demo catalog data
scripts/db.mjs          embedded PostgreSQL for local development
src/app/(store)/        storefront routes (layout = header, marquee, footer, drawers)
src/app/admin/          admin panel (own layout, ADMIN role only)
src/app/api/            route handlers (products, diamonds, search, checkout, payments, account…)
src/components/         ui · layout · art · product · pdp · collection · cart · home · content · account · admin
src/config/             brand, navigation & mega-menus, quiz
src/lib/                catalog vocabulary, filters & smart search, pricing, SEO helpers, types
src/lib/server/         Prisma client, auth, catalog queries, cache, storage, revalidation
src/store/              Zustand stores (cart, wishlist, compare, recently viewed, UI)
```

- **Money** is in Indian rupees (`site.currency` = INR, `en-IN` formatting such as ₹2,61,900), stored as integer paise (₹1 = 100) everywhere. GST is 3% (Admin → Settings). The demo catalogue is authored in US dollars and converted at ₹95 = $1 by the seed and by the `prices_in_inr` migration.
- **Pricing**: `variant price (purity × colour)` + `selected diamond` or `total-weight package`. `Product.fromPrice` is denormalised for fast sorting and filtering and recomputed whenever variants, options or diamond inventory change.
- **Filtering**: one predicate (`src/lib/filters.ts`) drives both listings and disjunctive facet counts, so counts and results always agree. The catalog index is cached with the `products` tag and revalidated by admin writes.
- **Caching**: Next.js data cache with tags (`products`, `categories`, `collections`, `settings`) + optional Redis for API responses.
- **SEO**: per-page metadata with canonical URLs, Open Graph images (generated per product), `sitemap.xml`, `robots.txt`, and JSON-LD for Organization, WebSite search, Product (offers, rating, reviews), BreadcrumbList, ItemList and FAQPage.
- **Security**: role-gated middleware for `/admin` and `/account`, zod validation on every API, server-side re-pricing, HMAC verification of Razorpay signatures, rate limits on public forms.

## Performance & quality (measured)

Lighthouse 13, mobile preset (simulated slow 4G, 4× CPU), production build:

| Page | Performance | Accessibility | Best practices | SEO |
| --- | --- | --- | --- | --- |
| Home | 88 | 100 | 100 | 100 |
| Engagement rings (listing) | 90 | 100 | 100 | 100 |
| Product page | 91 | 100 | 100 | 100 |
| All jewelry | 90 | 100 | 100 | 100 |
| About · Gifts · Find Your Match | 93–94 | 100 | 100 | 100 |

What keeps it fast: server components by default; product art below the fold mounts only as it nears the viewport (`LazyMount`); hover views render on first hover; Framer Motion loads its animation features after hydration (`LazyMotion` + `m.*` components — `strict` mode flags any `motion.*`); fonts are self-hosted Latin subsets in `public/fonts` with metric-matched fallbacks and preloads (zero layout shift); metadata is rendered in `<head>` for every client.

> Note: `next/font` is not used because its preload manifest came out empty when building from a path containing spaces on Windows — the self-hosted setup in `globals.css` + `layout.tsx` behaves the same everywhere.

## Notes for operators

- **Order notes** — `Order.notes` holds only the customer's own checkout note; staff and system notes (e.g. inventory shortfalls found at payment) live in `Order.adminNotes` and are never shown to customers.
- **Roles** are re-checked against the database on every admin request, so demoting an admin takes effect immediately.
- **Uploads** are validated by file signature (magic bytes), not just the declared MIME type.
- **After re-seeding**, existing sessions point at user ids that no longer exist — sign out and back in.
- **Production build alongside `next dev`**: `NEXT_DIST_DIR=.next-prod npm run build` then `NEXT_DIST_DIR=.next-prod npx next start -p 3100`.

## Deploying

Live on Vercel, built from the `main` branch on GitHub — every push redeploys. Vercel runs `npm run vercel-build` (`scripts/vercel-build.mjs`): it applies pending migrations, loads the demo catalogue only when the database is empty, then builds. Needed env vars: a Postgres connection (the Neon integration provides it), `NEXTAUTH_SECRET`, and `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` for the first deploy's admin account. `BLOB_READ_WRITE_TOKEN` (Vercel Blob) stores admin uploads.

Elsewhere: provision PostgreSQL, set the env vars above, run `npx prisma migrate deploy`, then `npm run build && npm start`.

## Scripts

| Script | |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js |
| `npm run typecheck` | TypeScript |
| `npm run db:start` | Embedded PostgreSQL |
| `npm run db:migrate` | Create a migration after editing the schema |
| `npm run db:deploy` | Apply migrations |
| `npm run db:seed` | Reset & seed demo data |
| `npm run db:studio` | Prisma Studio |
