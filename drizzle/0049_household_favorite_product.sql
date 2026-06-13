CREATE TABLE IF NOT EXISTS "household_favorite_product" (
	"household_id" text NOT NULL REFERENCES "household"("id") ON DELETE CASCADE,
	"normalized_key" text NOT NULL,
	"barcode" text,
	"display_name" text NOT NULL,
	"quantity" text NOT NULL,
	"unit" text,
	"notes" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	PRIMARY KEY ("household_id", "normalized_key")
);

CREATE UNIQUE INDEX IF NOT EXISTS "household_favorite_product_barcode_idx"
	ON "household_favorite_product" ("household_id", "barcode")
	WHERE "barcode" IS NOT NULL;
