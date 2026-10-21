-- DropIndex
DROP INDEX "product_variants_productId_purity_metalColor_key";

-- AlterTable
ALTER TABLE "product_images" ADD COLUMN     "shape" TEXT;

-- AlterTable
ALTER TABLE "product_variants" ADD COLUMN     "centerCarat" DOUBLE PRECISION,
ADD COLUMN     "length" TEXT,
ADD COLUMN     "shape" TEXT,
ADD COLUMN     "sizePrices" JSONB,
ADD COLUMN     "stones" JSONB,
ADD COLUMN     "totalCarat" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "caratKind" TEXT,
ADD COLUMN     "familyKey" TEXT,
ADD COLUMN     "madeToOrder" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "optionAxes" TEXT[],
ADD COLUMN     "priceTo" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "productType" TEXT,
ADD COLUMN     "ringSizes" TEXT[],
ADD COLUMN     "showEngraving" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sourceTitle" TEXT,
ADD COLUMN     "variantCount" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "product_variants_productId_purity_metalColor_idx" ON "product_variants"("productId", "purity", "metalColor");

-- CreateIndex
CREATE UNIQUE INDEX "products_familyKey_key" ON "products"("familyKey");


-- Backfill existing (admin-made) products
UPDATE "products" SET "optionAxes" = '{}' WHERE "optionAxes" IS NULL;
UPDATE "products" SET "ringSizes" = '{}' WHERE "ringSizes" IS NULL;
UPDATE "products" SET "showEngraving" = "requiresSize";
UPDATE "products" p SET
  "priceTo" = COALESCE((SELECT MAX(v."price") FROM "product_variants" v WHERE v."productId" = p."id"), 0),
  "variantCount" = (SELECT COUNT(*) FROM "product_variants" v WHERE v."productId" = p."id");
