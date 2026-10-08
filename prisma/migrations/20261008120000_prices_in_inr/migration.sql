-- Switch the store from US dollars to Indian rupees (INR).
-- Money stays an integer of minor units (paise now, cents before), converted at ₹95 = $1.
-- Catalogue prices are rounded to the nearest ₹100; orders and payments are converted
-- exactly so their totals still add up.

-- catalogue
UPDATE "product_variants"        SET "price"      = ROUND("price"      * 95 / 10000.0) * 10000;
UPDATE "diamonds"                SET "price"      = ROUND("price"      * 95 / 10000.0) * 10000;
UPDATE "product_diamond_options" SET "priceDelta" = ROUND("priceDelta" * 95 / 10000.0) * 10000;
UPDATE "products"                SET "basePrice"  = ROUND("basePrice"  * 95 / 10000.0) * 10000;

-- "From" price = cheapest active metal + cheapest fitting diamond (or cheapest diamond-weight option)
UPDATE "products" p SET "fromPrice" =
  COALESCE((SELECT MIN(v."price") FROM "product_variants" v WHERE v."productId" = p."id" AND v."isActive"), 0) +
  COALESCE(
    (SELECT MIN(d."price") FROM "product_diamond_options" o
       JOIN "diamonds" d ON d."shape" = o."shape" AND d."isAvailable"
        AND d."carat" >= COALESCE(o."minCarat", 0) - 0.000001 AND d."carat" <= COALESCE(o."maxCarat", 99) + 0.000001
      WHERE o."productId" = p."id" AND o."kind" = 'CENTER_STONE'),
    (SELECT MIN(o."priceDelta") FROM "product_diamond_options" o WHERE o."productId" = p."id" AND o."kind" = 'TOTAL_WEIGHT'),
    0);

-- orders & payments (exact conversion)
UPDATE "orders" SET "subtotal" = "subtotal" * 95, "discount" = "discount" * 95, "shipping" = "shipping" * 95,
  "tax" = "tax" * 95, "total" = "total" * 95, "currency" = 'INR' WHERE "currency" = 'USD';
UPDATE "order_items" SET "unitPrice" = "unitPrice" * 95, "lineTotal" = "lineTotal" * 95;
UPDATE "payments" SET "amount" = "amount" * 95, "currency" = 'INR' WHERE "currency" = 'USD';
ALTER TABLE "orders" ALTER COLUMN "currency" SET DEFAULT 'INR';
ALTER TABLE "payments" ALTER COLUMN "currency" SET DEFAULT 'INR';

-- coupons: fixed discounts to the nearest ₹500, minimum spends to the nearest ₹10,000
UPDATE "coupons" SET "value" = ROUND("value" * 95 / 50000.0) * 50000 WHERE "type" = 'FIXED';
UPDATE "coupons" SET "minSubtotal" = ROUND("minSubtotal" * 95 / 1000000.0) * 1000000;
UPDATE "coupons" SET "description" = '₹14,500 off orders over ₹1,40,000' WHERE "code" = 'LUXE150' AND "description" = '$150 off orders over $1,500';
UPDATE "coupons" SET "description" = '15% off bridal orders over ₹1,90,000' WHERE "code" = 'BRIDAL15' AND "description" = '15% off bridal orders over $2,000';

-- store settings: shipping prices and GST label
UPDATE "settings" SET "value" = jsonb_set(
  "value",
  '{shippingMethods}',
  (SELECT COALESCE(jsonb_agg(
     CASE m->>'id'
       WHEN 'express'  THEN jsonb_set(m, '{price}', '150000')
       WHEN 'priority' THEN jsonb_set(m, '{price}', '300000')
       ELSE jsonb_set(m, '{price}', to_jsonb(ROUND((m->>'price')::numeric * 95 / 10000) * 10000))
     END ORDER BY i), '[]'::jsonb)
   FROM jsonb_array_elements("value"->'shippingMethods') WITH ORDINALITY AS t(m, i))
) WHERE "key" = 'store' AND jsonb_typeof("value"->'shippingMethods') = 'array';
UPDATE "settings" SET "value" = jsonb_set("value", '{taxLabel}', '"GST"')
  WHERE "key" = 'store' AND "value"->>'taxLabel' = 'Estimated taxes';

-- Find Your Match quiz: budget answers in rupees
UPDATE "recommendation_quiz" SET "questions" = (
  SELECT jsonb_agg(
    CASE WHEN q->>'id' = 'budget' THEN jsonb_set(q, '{options}', '[
      {"value": "0-50000", "label": "Under ₹50,000"},
      {"value": "50000-100000", "label": "₹50,000 – ₹1,00,000"},
      {"value": "100000-250000", "label": "₹1,00,000 – ₹2,50,000"},
      {"value": "250000-500000", "label": "₹2,50,000 – ₹5,00,000"},
      {"value": "500000-", "label": "₹5,00,000+"}
    ]'::jsonb) ELSE q END ORDER BY i)
  FROM jsonb_array_elements("questions") WITH ORDINALITY AS t(q, i)
) WHERE jsonb_typeof("questions") = 'array';
