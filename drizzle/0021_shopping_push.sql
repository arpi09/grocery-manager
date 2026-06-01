ALTER TABLE "user" ADD COLUMN "shopping_push_enabled" boolean DEFAULT false NOT NULL;
ALTER TABLE "user" ADD COLUMN "shopping_push_last_sent_at" timestamp with time zone;
