-- The homepage hero film for computers (landscape, shipped in /public/videos); phones keep the portrait cut.
UPDATE "settings"
SET "value" = jsonb_set("value", '{hero}', COALESCE("value" -> 'hero', '{}'::jsonb) || '{"video": "/videos/hero-desktop.mp4"}'::jsonb)
WHERE "key" = 'store';
