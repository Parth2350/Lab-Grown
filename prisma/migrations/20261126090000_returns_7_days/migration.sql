-- Returns window is now 7 days (was 30). Changed only where the store still has the old default, so a window or
-- announcement set in the admin is kept.

UPDATE "settings"
SET "value" = jsonb_set("value", '{returnsDays}', '7'::jsonb)
WHERE "key" = 'store' AND "value" -> 'returnsDays' = '30'::jsonb;

UPDATE "settings"
SET "value" = jsonb_set(
  "value",
  '{announcements}',
  (SELECT jsonb_agg(CASE WHEN a = '"30-Day Easy Returns"'::jsonb THEN '"7-Day Easy Returns"'::jsonb ELSE a END ORDER BY i)
   FROM jsonb_array_elements("value" -> 'announcements') WITH ORDINALITY AS t(a, i))
)
WHERE "key" = 'store' AND "value" -> 'announcements' @> '["30-Day Easy Returns"]'::jsonb;
