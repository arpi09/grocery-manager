CREATE TABLE IF NOT EXISTS "household_receipt_forward_token" (
	"id" text PRIMARY KEY NOT NULL,
	"household_id" text NOT NULL,
	"token_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"rotated_at" timestamp with time zone
);

DO $$ BEGIN
 ALTER TABLE "household_receipt_forward_token" ADD CONSTRAINT "household_receipt_forward_token_household_id_household_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."household"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "household_receipt_forward_token_household_idx" ON "household_receipt_forward_token" USING btree ("household_id");
CREATE INDEX IF NOT EXISTS "household_receipt_forward_token_hash_idx" ON "household_receipt_forward_token" USING btree ("token_hash");
