-- A customer's personal code (the new-account welcome offer)
ALTER TABLE "coupons" ADD COLUMN "userId" TEXT;

CREATE UNIQUE INDEX "coupons_userId_key" ON "coupons"("userId");

ALTER TABLE "coupons" ADD CONSTRAINT "coupons_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
