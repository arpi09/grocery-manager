ALTER TABLE "market_chat_thread" ADD COLUMN IF NOT EXISTS "lifecycle_status" text DEFAULT 'chatting' NOT NULL;
--> statement-breakpoint
ALTER TABLE "market_chat_thread" ADD COLUMN IF NOT EXISTS "pickup_agreed_at" timestamp with time zone;
--> statement-breakpoint
UPDATE "market_chat_thread"
SET "lifecycle_status" = 'completed'
WHERE "exchange_status" = 'completed'
	OR ("seeker_completed_at" IS NOT NULL AND "sharer_completed_at" IS NOT NULL);
--> statement-breakpoint
UPDATE "market_chat_thread"
SET "lifecycle_status" = 'awaiting_handover'
WHERE "lifecycle_status" = 'chatting'
	AND (
		"seeker_completed_at" IS NOT NULL
		OR "sharer_completed_at" IS NOT NULL
	);
--> statement-breakpoint
UPDATE "market_chat_thread" AS t
SET "lifecycle_status" = 'reported'
FROM "market_chat_report" AS r
WHERE r."thread_id" = t."id"
	AND r."dismissed_at" IS NULL
	AND t."lifecycle_status" NOT IN ('completed', 'cancelled');
--> statement-breakpoint
ALTER TABLE "market_exchange_rating" ADD COLUMN IF NOT EXISTS "comment" text;
--> statement-breakpoint
ALTER TABLE "market_exchange_rating" ADD COLUMN IF NOT EXISTS "items_as_described" text;
--> statement-breakpoint
ALTER TABLE "market_exchange_rating" ADD COLUMN IF NOT EXISTS "revealed_at" timestamp with time zone;
--> statement-breakpoint
UPDATE "market_chat_report"
SET "reason" = 'inappropriate'
WHERE "reason" IS NULL OR trim("reason") = '';
