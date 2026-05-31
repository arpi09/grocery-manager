ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "push_notifications_enabled" boolean DEFAULT false NOT NULL;

CREATE TABLE IF NOT EXISTS "push_subscription" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "push_subscription_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade
);

CREATE UNIQUE INDEX IF NOT EXISTS "push_subscription_endpoint_idx" ON "push_subscription" ("endpoint");
CREATE INDEX IF NOT EXISTS "push_subscription_user_idx" ON "push_subscription" ("user_id");
