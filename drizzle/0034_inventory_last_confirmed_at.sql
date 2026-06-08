ALTER TABLE "inventory_items" ADD COLUMN IF NOT EXISTS "last_confirmed_at" timestamp with time zone;
UPDATE "inventory_items" SET "last_confirmed_at" = "created_at" WHERE "last_confirmed_at" IS NULL;
ALTER TABLE "inventory_items" ALTER COLUMN "last_confirmed_at" SET DEFAULT now();
ALTER TABLE "inventory_items" ALTER COLUMN "last_confirmed_at" SET NOT NULL;
