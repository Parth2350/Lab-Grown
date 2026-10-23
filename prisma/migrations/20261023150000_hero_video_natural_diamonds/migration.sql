-- The homepage hero film for phones (portrait, shipped in /public/videos) and copy that now covers natural diamonds
-- as well. Text is changed only where it is still the original default, so edits made in the admin are kept.

UPDATE "settings"
SET "value" = jsonb_set("value", '{hero}', COALESCE("value" -> 'hero', '{}'::jsonb) || '{"videoMobile": "/videos/hero.mp4"}'::jsonb)
WHERE "key" = 'store';

UPDATE "settings"
SET "value" = jsonb_set("value", '{hero,eyebrow}', '"Natural & Lab-Grown Diamond Fine Jewelry"'::jsonb)
WHERE "key" = 'store' AND "value" #>> '{hero,eyebrow}' = 'Lab-Grown Diamond Fine Jewelry';

UPDATE "settings"
SET "value" = jsonb_set("value", '{hero,subtitle}', '"Discover beautifully crafted natural and lab-grown diamond jewelry designed to celebrate your most meaningful moments."'::jsonb)
WHERE "key" = 'store' AND "value" #>> '{hero,subtitle}' = 'Discover beautifully crafted lab-grown diamond jewelry designed to celebrate your most meaningful moments.';

UPDATE "settings"
SET "value" = jsonb_set(
  "value",
  '{announcements}',
  (SELECT jsonb_agg(CASE WHEN a = '"Premium Lab-Grown Diamonds"'::jsonb THEN '"Natural & Lab-Grown Diamonds"'::jsonb ELSE a END ORDER BY i)
   FROM jsonb_array_elements("value" -> 'announcements') WITH ORDINALITY AS t(a, i))
)
WHERE "key" = 'store' AND "value" -> 'announcements' @> '["Premium Lab-Grown Diamonds"]'::jsonb;
