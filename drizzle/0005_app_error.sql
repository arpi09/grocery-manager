CREATE TABLE IF NOT EXISTS "app_error" (
	"id" text PRIMARY KEY NOT NULL,
	"message" text NOT NULL,
	"stack" text,
	"path" text NOT NULL,
	"user_id" text,
	"status_code" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "app_error_created_at_idx" ON "app_error" ("created_at" DESC);
