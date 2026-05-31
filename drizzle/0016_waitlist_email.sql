CREATE TABLE IF NOT EXISTS "waitlist_email" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"user_id" text,
	"source" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "waitlist_email_email_idx" ON "waitlist_email" ("email");
CREATE INDEX IF NOT EXISTS "waitlist_email_created_idx" ON "waitlist_email" ("created_at");
