CREATE TABLE IF NOT EXISTS "market_chat_report" (
	"id" text PRIMARY KEY NOT NULL,
	"thread_id" text NOT NULL REFERENCES "market_chat_thread"("id") ON DELETE CASCADE,
	"reporter_user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
	"reason" text,
	"dismissed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "market_chat_report_thread_idx" ON "market_chat_report" ("thread_id");
CREATE INDEX IF NOT EXISTS "market_chat_report_reporter_idx" ON "market_chat_report" ("reporter_user_id");
CREATE INDEX IF NOT EXISTS "market_chat_report_open_idx" ON "market_chat_report" ("created_at") WHERE "dismissed_at" IS NULL;
