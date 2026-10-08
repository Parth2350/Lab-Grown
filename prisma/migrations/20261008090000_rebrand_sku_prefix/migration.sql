-- Rebrand to The V Jewels: catalogue SKUs move from the AUR- prefix to TVJ-.
-- Order numbers and order-line SKUs are historical records and keep their original values.
UPDATE "products" SET "sku" = 'TVJ-' || substring("sku" from 5) WHERE "sku" LIKE 'AUR-%';
UPDATE "product_variants" SET "sku" = 'TVJ-' || substring("sku" from 5) WHERE "sku" LIKE 'AUR-%';
