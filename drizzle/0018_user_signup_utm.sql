ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "signup_utm_source" text;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "signup_utm_medium" text;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "signup_utm_campaign" text;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "signup_utm_content" text;
