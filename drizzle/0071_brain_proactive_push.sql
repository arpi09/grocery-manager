-- Brain proactive push: daily guard + briefing cadence timestamps
ALTER TABLE "user"
	ADD COLUMN IF NOT EXISTS brain_push_daily_count integer NOT NULL DEFAULT 0;

ALTER TABLE "user"
	ADD COLUMN IF NOT EXISTS brain_push_daily_date date;

ALTER TABLE "user"
	ADD COLUMN IF NOT EXISTS weekly_briefing_last_sent_at timestamp with time zone;

ALTER TABLE "user"
	ADD COLUMN IF NOT EXISTS pre_shop_briefing_last_sent_at timestamp with time zone;
