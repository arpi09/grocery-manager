ALTER TABLE "user"
	ADD COLUMN IF NOT EXISTS "staleness_reminders_enabled" boolean NOT NULL DEFAULT false,
	ADD COLUMN IF NOT EXISTS "staleness_reminder_last_sent_at" timestamp with time zone;
