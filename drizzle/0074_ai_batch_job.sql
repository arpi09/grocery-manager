-- AI Batch API jobs table (latency-insensitive cron work, 50 percent discount).
-- payload holds the custom_id to target mapping, result caches consumable output.
-- NOTE: init.ts splits migration files on the statement separator, so comments
-- here must not contain that punctuation character.
CREATE TABLE IF NOT EXISTS "ai_batch_job" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"status" text NOT NULL,
	"openai_batch_id" text,
	"input_file_id" text,
	"output_file_id" text,
	"request_count" integer NOT NULL DEFAULT 0,
	"payload" jsonb NOT NULL DEFAULT '{}'::jsonb,
	"result" jsonb,
	"error" text,
	"created_at" timestamp with time zone NOT NULL DEFAULT now(),
	"updated_at" timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "ai_batch_job_status_idx" ON "ai_batch_job" ("status");
CREATE INDEX IF NOT EXISTS "ai_batch_job_kind_created_idx" ON "ai_batch_job" ("kind", "created_at");
