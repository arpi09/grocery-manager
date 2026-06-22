INSERT INTO "app_settings" ("key", "value", "updated_at")
VALUES ('market_live_enabled', 'false', now())
ON CONFLICT ("key") DO NOTHING;
