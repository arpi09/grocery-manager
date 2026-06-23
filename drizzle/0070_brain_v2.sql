-- Brain v2: daily moving-soon reminder claim + optional auto-finish after expired section
ALTER TABLE "user"
	ADD COLUMN IF NOT EXISTS expiry_moving_soon_last_sent_at timestamp with time zone;

ALTER TABLE "user"
	ADD COLUMN IF NOT EXISTS auto_finish_expired_enabled boolean NOT NULL DEFAULT false;

ALTER TABLE "user"
	ADD COLUMN IF NOT EXISTS auto_finish_expired_days integer NOT NULL DEFAULT 30;
