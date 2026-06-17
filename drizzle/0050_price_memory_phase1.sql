-- Price Memory Phase 1: extend receipt_purchase_line event store + household concept table

ALTER TABLE "receipt_purchase_line"
	ADD COLUMN IF NOT EXISTS "inventory_item_id" text REFERENCES "inventory_items"("id") ON DELETE SET NULL,
	ADD COLUMN IF NOT EXISTS "concept_key" text,
	ADD COLUMN IF NOT EXISTS "match_source" text,
	ADD COLUMN IF NOT EXISTS "import_source" text,
	ADD COLUMN IF NOT EXISTS "line_index" integer NOT NULL DEFAULT 0;

WITH numbered AS (
	SELECT
		"id",
		(ROW_NUMBER() OVER (PARTITION BY "import_batch_id" ORDER BY "created_at", "id") - 1)::integer AS idx
	FROM "receipt_purchase_line"
)
UPDATE "receipt_purchase_line" AS rpl
SET "line_index" = numbered.idx
FROM numbered
WHERE rpl."id" = numbered."id";

UPDATE "receipt_purchase_line"
SET "concept_key" = "normalized_key"
WHERE "concept_key" IS NULL;

UPDATE "receipt_purchase_line"
SET "import_source" = 'unknown'
WHERE "import_source" IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "receipt_purchase_line_batch_line_idx"
	ON "receipt_purchase_line" ("import_batch_id", "line_index");

CREATE INDEX IF NOT EXISTS "receipt_purchase_line_household_concept_purchased_idx"
	ON "receipt_purchase_line" ("household_id", "concept_key", "purchased_at" DESC);

CREATE INDEX IF NOT EXISTS "receipt_purchase_line_household_inventory_purchased_idx"
	ON "receipt_purchase_line" ("household_id", "inventory_item_id", "purchased_at" DESC);

CREATE TABLE IF NOT EXISTS "household_purchase_concept" (
	"household_id" text NOT NULL REFERENCES "household"("id") ON DELETE CASCADE,
	"concept_key" text NOT NULL,
	"display_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	PRIMARY KEY ("household_id", "concept_key")
);
