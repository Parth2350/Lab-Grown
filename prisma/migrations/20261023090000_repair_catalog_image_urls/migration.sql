-- 425 partner-catalogue products came with photo links carrying a corrupted host prefix
-- ("https://vats-wt.s3.ap-south-1.amazonaws.com/brilliance_carat/ No newline at end of filewebassests.s3...");
-- point them at the media host they belong to.
UPDATE "product_images"
SET "url" = 'https://' || substr("url", length('https://vats-wt.s3.ap-south-1.amazonaws.com/brilliance_carat/ No newline at end of file') + 1)
WHERE "url" LIKE 'https://vats-wt.s3.ap-south-1.amazonaws.com/brilliance\_carat/ No newline at end of file%';
