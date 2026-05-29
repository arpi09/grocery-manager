UPDATE "household_member" SET "role" = 'editor' WHERE "role" = 'member';

CREATE TABLE IF NOT EXISTS "household_invite" (
	"id" text PRIMARY KEY NOT NULL,
	"household_id" text NOT NULL,
	"email" text NOT NULL,
	"role" text NOT NULL,
	"token" text NOT NULL,
	"invited_by_user_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "household_invite_token_unique" UNIQUE("token")
);

ALTER TABLE "household_invite" ADD CONSTRAINT "household_invite_household_id_household_id_fk" FOREIGN KEY ("household_id") REFERENCES "household"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "household_invite" ADD CONSTRAINT "household_invite_invited_by_user_id_user_id_fk" FOREIGN KEY ("invited_by_user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;

CREATE INDEX IF NOT EXISTS "household_invite_household_idx" ON "household_invite" USING btree ("household_id");
CREATE INDEX IF NOT EXISTS "household_invite_token_idx" ON "household_invite" USING btree ("token");
