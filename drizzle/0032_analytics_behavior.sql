CREATE TABLE IF NOT EXISTS "analytics_session" (
	"id" text PRIMARY KEY NOT NULL,
	"visitor_id" text NOT NULL,
	"user_id" text REFERENCES "user"("id") ON DELETE SET NULL,
	"household_id" text REFERENCES "household"("id") ON DELETE SET NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_agent_hash" text
);
CREATE INDEX IF NOT EXISTS "analytics_session_visitor_last_seen_idx" ON "analytics_session" ("visitor_id", "last_seen_at");
CREATE INDEX IF NOT EXISTS "analytics_session_started_idx" ON "analytics_session" ("started_at");

CREATE TABLE IF NOT EXISTS "analytics_page_view" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL REFERENCES "analytics_session"("id") ON DELETE CASCADE,
	"route" text NOT NULL,
	"entered_at" timestamp with time zone NOT NULL,
	"exited_at" timestamp with time zone,
	"duration_ms" integer,
	"referrer_route" text
);
CREATE INDEX IF NOT EXISTS "analytics_page_view_route_entered_idx" ON "analytics_page_view" ("route", "entered_at");
CREATE INDEX IF NOT EXISTS "analytics_page_view_session_idx" ON "analytics_page_view" ("session_id", "entered_at");

CREATE TABLE IF NOT EXISTS "analytics_interaction" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL REFERENCES "analytics_session"("id") ON DELETE CASCADE,
	"route" text NOT NULL,
	"element_key" text NOT NULL,
	"kind" text NOT NULL,
	"value" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "analytics_interaction_route_element_idx" ON "analytics_interaction" ("route", "element_key", "created_at");
CREATE INDEX IF NOT EXISTS "analytics_interaction_created_idx" ON "analytics_interaction" ("created_at");

CREATE TABLE IF NOT EXISTS "analytics_route_daily" (
	"day" date NOT NULL,
	"route" text NOT NULL,
	"view_count" integer NOT NULL DEFAULT 0,
	"unique_sessions" integer NOT NULL DEFAULT 0,
	"avg_duration_ms" integer NOT NULL DEFAULT 0,
	PRIMARY KEY ("day", "route")
);

CREATE TABLE IF NOT EXISTS "analytics_element_daily" (
	"day" date NOT NULL,
	"route" text NOT NULL,
	"element_key" text NOT NULL,
	"click_count" integer NOT NULL DEFAULT 0,
	PRIMARY KEY ("day", "route", "element_key")
);
