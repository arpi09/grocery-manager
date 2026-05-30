CREATE TABLE IF NOT EXISTS "ai_usage" (
	"id" text PRIMARY KEY NOT NULL,
	"scope_id" text NOT NULL,
	"user_id" text NOT NULL,
	"kind" text NOT NULL,
	"period_key" text NOT NULL,
	"count" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "ai_usage_scope_kind_period_idx" ON "ai_usage" ("scope_id", "kind", "period_key");
CREATE INDEX IF NOT EXISTS "ai_usage_user_updated_idx" ON "ai_usage" ("user_id", "updated_at");
