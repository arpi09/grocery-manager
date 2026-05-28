CREATE TABLE IF NOT EXISTS "household" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "household_member" (
	"household_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text NOT NULL,
	CONSTRAINT "household_member_household_id_user_id_pk" PRIMARY KEY("household_id","user_id")
);

ALTER TABLE "household_member" ADD CONSTRAINT "household_member_household_id_household_id_fk" FOREIGN KEY ("household_id") REFERENCES "household"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "household_member" ADD CONSTRAINT "household_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;

CREATE INDEX IF NOT EXISTS "household_member_user_idx" ON "household_member" USING btree ("user_id");

ALTER TABLE "inventory_items" ADD COLUMN IF NOT EXISTS "household_id" text;

UPDATE "inventory_items" AS i
SET "household_id" = hm."household_id"
FROM "household_member" AS hm
WHERE hm."user_id" = i."user_id"
	AND i."household_id" IS NULL;

ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_household_id_household_id_fk" FOREIGN KEY ("household_id") REFERENCES "household"("id") ON DELETE cascade ON UPDATE no action;

DROP INDEX IF EXISTS "inventory_user_location_idx";
DROP INDEX IF EXISTS "inventory_user_expires_idx";

CREATE INDEX IF NOT EXISTS "inventory_household_location_idx" ON "inventory_items" USING btree ("household_id","location");
CREATE INDEX IF NOT EXISTS "inventory_household_expires_idx" ON "inventory_items" USING btree ("household_id","expires_on");
