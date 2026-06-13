CREATE TABLE IF NOT EXISTS "household_location_rule" (
	"household_id" text NOT NULL REFERENCES "household"("id") ON DELETE CASCADE,
	"normalized_key" text NOT NULL,
	"location" text NOT NULL,
	"sample_count" integer NOT NULL DEFAULT 0,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	PRIMARY KEY ("household_id", "normalized_key")
);
