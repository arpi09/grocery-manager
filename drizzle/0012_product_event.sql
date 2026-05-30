CREATE TABLE IF NOT EXISTS "product_event" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"household_id" text,
	"event_type" text NOT NULL,
	"metadata" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "product_event_user_created_idx" ON "product_event" ("user_id","created_at");
CREATE INDEX IF NOT EXISTS "product_event_type_created_idx" ON "product_event" ("event_type","created_at");
CREATE INDEX IF NOT EXISTS "product_event_household_created_idx" ON "product_event" ("household_id","created_at");
