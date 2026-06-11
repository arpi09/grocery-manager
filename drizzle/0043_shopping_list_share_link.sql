CREATE TABLE IF NOT EXISTS "shopping_list_share_link" (
	"id" text PRIMARY KEY NOT NULL,
	"household_id" text NOT NULL,
	"created_by_user_id" text NOT NULL,
	"token_hash" text NOT NULL,
	"snapshot_json" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "shopping_list_share_link" ADD CONSTRAINT "shopping_list_share_link_household_id_household_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."household"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "shopping_list_share_link" ADD CONSTRAINT "shopping_list_share_link_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "shopping_list_share_link_token_hash_idx" ON "shopping_list_share_link" USING btree ("token_hash");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "shopping_list_share_link_household_idx" ON "shopping_list_share_link" USING btree ("household_id");
