CREATE TABLE IF NOT EXISTS "social_post" (
	"id" text PRIMARY KEY NOT NULL,
	"channel" text NOT NULL DEFAULT 'linkedin',
	"status" text NOT NULL DEFAULT 'draft',
	"title" text,
	"body" text NOT NULL,
	"link_url" text,
	"utm_source" text,
	"utm_medium" text,
	"utm_campaign" text,
	"utm_content" text,
	"image_path" text,
	"source" text NOT NULL DEFAULT 'manual',
	"approved_by" text REFERENCES "user"("id") ON DELETE SET NULL,
	"approved_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	"external_id" text,
	"publish_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "social_post_status_created_idx" ON "social_post" ("status", "created_at");
