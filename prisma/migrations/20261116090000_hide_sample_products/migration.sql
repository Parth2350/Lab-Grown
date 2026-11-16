-- Take the sample products off the storefront. The store sells the partner catalogue, whose products all carry a
-- familyKey; anything without one was made by hand for testing (e.g. "ring", "necklaces"). They are hidden, not
-- deleted — switch one back on in Admin → Products if it should be for sale.
UPDATE "products" SET "isActive" = false WHERE "familyKey" IS NULL AND "isActive" = true;
