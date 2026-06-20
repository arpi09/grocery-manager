-- Open Food Facts product cache keyed by barcode (Phase 2 list/grid product photos)

CREATE TABLE IF NOT EXISTS "product_catalog" (
	"barcode" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"image_url" text,
	"source" text NOT NULL DEFAULT 'open_food_facts',
	"updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE "inventory_items" ADD COLUMN IF NOT EXISTS "barcode" text;

CREATE INDEX IF NOT EXISTS "inventory_household_barcode_idx"
	ON "inventory_items" ("household_id", "barcode")
	WHERE "barcode" IS NOT NULL;
