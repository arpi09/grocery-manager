CREATE TABLE IF NOT EXISTS "household_shelf_life_rule" (
	"household_id" text NOT NULL REFERENCES "household"("id") ON DELETE CASCADE,
	"normalized_key" text NOT NULL,
	"location" text NOT NULL,
	"typical_days" integer NOT NULL,
	"sample_count" integer NOT NULL DEFAULT 0,
	"last_predicted_days" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	PRIMARY KEY ("household_id", "normalized_key", "location")
);

CREATE TABLE IF NOT EXISTS "learning_feedback" (
	"id" text PRIMARY KEY NOT NULL,
	"household_id" text NOT NULL REFERENCES "household"("id") ON DELETE CASCADE,
	"user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
	"predictor_id" text NOT NULL,
	"subject_key" text NOT NULL,
	"context_json" jsonb NOT NULL DEFAULT '{}',
	"predicted_value" text NOT NULL,
	"actual_value" text,
	"feedback_type" text NOT NULL,
	"model_version" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "learning_feedback_household_predictor_created_idx"
	ON "learning_feedback" ("household_id", "predictor_id", "created_at");

CREATE INDEX IF NOT EXISTS "learning_feedback_household_subject_key_idx"
	ON "learning_feedback" ("household_id", "subject_key");
