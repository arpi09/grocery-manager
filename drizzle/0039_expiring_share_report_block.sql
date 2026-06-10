CREATE TABLE IF NOT EXISTS "expiring_share_report" (
	"id" text PRIMARY KEY NOT NULL,
	"share_id" text NOT NULL,
	"reporter_user_id" text NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "expiring_share_report_share_idx" ON "expiring_share_report" USING btree ("share_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "expiring_share_report_reporter_idx" ON "expiring_share_report" USING btree ("reporter_user_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "expiring_share_block" (
	"id" text PRIMARY KEY NOT NULL,
	"reporter_user_id" text NOT NULL,
	"share_id" text,
	"household_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "expiring_share_block_reporter_share_uidx" ON "expiring_share_block" USING btree ("reporter_user_id", "share_id") WHERE "share_id" IS NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "expiring_share_block_reporter_household_uidx" ON "expiring_share_block" USING btree ("reporter_user_id", "household_id") WHERE "household_id" IS NOT NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "expiring_share_block_reporter_idx" ON "expiring_share_block" USING btree ("reporter_user_id");
