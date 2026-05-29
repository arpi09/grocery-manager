CREATE TABLE IF NOT EXISTS "shopping_list_item" (
  "id" text PRIMARY KEY NOT NULL,
  "household_id" text NOT NULL,
  "name" text NOT NULL,
  "quantity" numeric(10, 2),
  "unit" text,
  "checked" boolean DEFAULT false NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "shopping_list_item" ADD CONSTRAINT "shopping_list_item_household_id_fk"
  FOREIGN KEY ("household_id") REFERENCES "household"("id") ON DELETE cascade ON UPDATE no action;

CREATE INDEX IF NOT EXISTS "shopping_list_household_sort_idx" ON "shopping_list_item" ("household_id", "sort_order");
