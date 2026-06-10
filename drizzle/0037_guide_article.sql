CREATE TABLE IF NOT EXISTS "guide_article" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL UNIQUE,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"body" text NOT NULL,
	"keywords" jsonb NOT NULL DEFAULT '[]',
	"article_date" text NOT NULL,
	"status" text NOT NULL DEFAULT 'draft',
	"source" text NOT NULL DEFAULT 'manual',
	"social_post_id" text REFERENCES "social_post"("id") ON DELETE SET NULL,
	"quality_warnings" jsonb,
	"approved_by" text REFERENCES "user"("id") ON DELETE SET NULL,
	"approved_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "guide_article_status_created_idx" ON "guide_article" ("status", "created_at");
CREATE INDEX IF NOT EXISTS "guide_article_slug_idx" ON "guide_article" ("slug");
