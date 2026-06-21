ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "auto_nearby_listing_enabled" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "market_first_name" text;
--> statement-breakpoint
ALTER TABLE "expiring_share_link" ADD COLUMN IF NOT EXISTS "source" text DEFAULT 'manual' NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "expiring_share_link_household_auto_nearby_uidx" ON "expiring_share_link" USING btree ("household_id") WHERE "source" = 'auto_nearby';
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "market_chat_thread" (
	"id" text PRIMARY KEY NOT NULL,
	"share_id" text NOT NULL,
	"seeker_user_id" text NOT NULL,
	"sharer_user_id" text NOT NULL,
	"household_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"closed_at" timestamp with time zone
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "market_chat_thread" ADD CONSTRAINT "market_chat_thread_share_id_expiring_share_link_id_fk" FOREIGN KEY ("share_id") REFERENCES "public"."expiring_share_link"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "market_chat_thread" ADD CONSTRAINT "market_chat_thread_seeker_user_id_user_id_fk" FOREIGN KEY ("seeker_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "market_chat_thread" ADD CONSTRAINT "market_chat_thread_sharer_user_id_user_id_fk" FOREIGN KEY ("sharer_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "market_chat_thread" ADD CONSTRAINT "market_chat_thread_household_id_household_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."household"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "market_chat_thread_share_idx" ON "market_chat_thread" USING btree ("share_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "market_chat_thread_seeker_idx" ON "market_chat_thread" USING btree ("seeker_user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "market_chat_thread_sharer_idx" ON "market_chat_thread" USING btree ("sharer_user_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "market_chat_message" (
	"id" text PRIMARY KEY NOT NULL,
	"thread_id" text NOT NULL,
	"author_user_id" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "market_chat_message" ADD CONSTRAINT "market_chat_message_thread_id_market_chat_thread_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."market_chat_thread"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "market_chat_message" ADD CONSTRAINT "market_chat_message_author_user_id_user_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "market_chat_message_thread_created_idx" ON "market_chat_message" USING btree ("thread_id", "created_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "market_exchange_rating" (
	"id" text PRIMARY KEY NOT NULL,
	"thread_id" text NOT NULL,
	"rater_user_id" text NOT NULL,
	"rated_user_id" text NOT NULL,
	"stars" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "market_exchange_rating" ADD CONSTRAINT "market_exchange_rating_thread_id_market_chat_thread_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."market_chat_thread"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "market_exchange_rating" ADD CONSTRAINT "market_exchange_rating_rater_user_id_user_id_fk" FOREIGN KEY ("rater_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "market_exchange_rating" ADD CONSTRAINT "market_exchange_rating_rated_user_id_user_id_fk" FOREIGN KEY ("rated_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "market_exchange_rating_thread_rater_uidx" ON "market_exchange_rating" USING btree ("thread_id", "rater_user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "market_exchange_rating_rated_user_idx" ON "market_exchange_rating" USING btree ("rated_user_id");
