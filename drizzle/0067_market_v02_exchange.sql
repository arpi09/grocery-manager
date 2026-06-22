ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "market_chat_push_enabled" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "market_chat_thread" ADD COLUMN IF NOT EXISTS "exchange_status" text DEFAULT 'ongoing' NOT NULL;
--> statement-breakpoint
ALTER TABLE "market_chat_thread" ADD COLUMN IF NOT EXISTS "seeker_completed_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "market_chat_thread" ADD COLUMN IF NOT EXISTS "sharer_completed_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "market_chat_thread" ADD COLUMN IF NOT EXISTS "seeker_last_read_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "market_chat_thread" ADD COLUMN IF NOT EXISTS "sharer_last_read_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "market_chat_thread" ADD COLUMN IF NOT EXISTS "reply_reminder_sent_at" timestamp with time zone;
--> statement-breakpoint
UPDATE "market_chat_thread" SET "exchange_status" = 'completed' WHERE "closed_at" IS NOT NULL AND "exchange_status" = 'ongoing';
