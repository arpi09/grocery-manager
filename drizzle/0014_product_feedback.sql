CREATE TABLE IF NOT EXISTS "product_feedback" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"household_id" text,
	"source" text NOT NULL,
	"churn_reason" text,
	"message" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "product_feedback_created_idx" ON "product_feedback" ("created_at");
CREATE INDEX IF NOT EXISTS "product_feedback_user_created_idx" ON "product_feedback" ("user_id", "created_at");
