-- Remove the sample orders so sales and analytics start from zero. Ordering is on WhatsApp now, so every
-- order in the database is a sample: the demo catalogue's seeded orders (payment ids "pay_demo…") and
-- test orders from the old demo checkout (provider "demo"). Any order with a genuine Razorpay payment is kept.
CREATE TEMP TABLE "sample_orders" AS
SELECT o."id"
FROM "orders" o
WHERE NOT EXISTS (
  SELECT 1 FROM "payments" p
  WHERE p."orderId" = o."id" AND p."provider" = 'razorpay' AND p."providerPaymentId" IS NOT NULL AND p."providerPaymentId" NOT LIKE 'pay\_demo%'
);

-- diamonds reserved by those orders go back on sale (unless a kept order holds them)
UPDATE "diamonds"
SET "isAvailable" = true
WHERE "isAvailable" = false
  AND "id" IN (SELECT "diamondId" FROM "order_items" WHERE "diamondId" IS NOT NULL AND "orderId" IN (SELECT "id" FROM "sample_orders"))
  AND "id" NOT IN (SELECT "diamondId" FROM "order_items" WHERE "diamondId" IS NOT NULL AND "orderId" NOT IN (SELECT "id" FROM "sample_orders"));

-- items, payments, shipments and return requests are removed with their order
DELETE FROM "orders" WHERE "id" IN (SELECT "id" FROM "sample_orders");

-- coupon use counts reflect the orders that remain
UPDATE "coupons" c SET "usedCount" = (SELECT COUNT(*) FROM "orders" o WHERE o."couponCode" = c."code");

DROP TABLE "sample_orders";
