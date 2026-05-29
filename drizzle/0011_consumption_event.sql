CREATE TABLE IF NOT EXISTS "consumption_event" (
	"id" text PRIMARY KEY NOT NULL,
	"household_id" text NOT NULL,
	"user_id" text NOT NULL,
	"inventory_item_id" text,
	"product_name" text NOT NULL,
	"event_type" text NOT NULL,
	"quantity" numeric(10, 2),
	"unit" text,
	"location" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "consumption_event_household_created_idx" ON "consumption_event" ("household_id","created_at");
