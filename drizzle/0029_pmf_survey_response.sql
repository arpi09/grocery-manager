CREATE TABLE IF NOT EXISTS "pmf_survey_response" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"household_id" text,
	"trigger" text NOT NULL,
	"nps_score" integer NOT NULL,
	"would_miss" text NOT NULL,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "pmf_survey_response_created_idx" ON "pmf_survey_response" ("created_at");
CREATE INDEX IF NOT EXISTS "pmf_survey_response_user_created_idx" ON "pmf_survey_response" ("user_id", "created_at");
