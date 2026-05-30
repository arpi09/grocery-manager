ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "expiry_reminders_enabled" boolean DEFAULT false NOT NULL;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "expiry_reminder_days" integer DEFAULT 7 NOT NULL;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "expiry_reminder_last_sent_at" timestamp with time zone;
