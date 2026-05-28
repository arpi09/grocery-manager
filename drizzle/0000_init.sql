CREATE TABLE IF NOT EXISTS "user" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"pets_enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);

CREATE TABLE IF NOT EXISTS "session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);

CREATE TABLE IF NOT EXISTS "inventory_items" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"location" text NOT NULL,
	"quantity" numeric(10, 2) DEFAULT '1' NOT NULL,
	"unit" text,
	"expires_on" date,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "recipe_ideas" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"why_it_fits" text NOT NULL,
	"ingredients_to_use" text NOT NULL,
	"missing_ingredients" text NOT NULL,
	"steps" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "meal_plans" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"planned_date" date NOT NULL,
	"notes" text,
	"idea_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "pets" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"species" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "pet_food_items" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"pet_id" text,
	"name" text NOT NULL,
	"quantity" numeric(10, 2) DEFAULT '1' NOT NULL,
	"unit" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "recipe_ideas" ADD CONSTRAINT "recipe_ideas_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "meal_plans" ADD CONSTRAINT "meal_plans_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "meal_plans" ADD CONSTRAINT "meal_plans_idea_id_recipe_ideas_id_fk" FOREIGN KEY ("idea_id") REFERENCES "recipe_ideas"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "pets" ADD CONSTRAINT "pets_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pet_food_items" ADD CONSTRAINT "pet_food_items_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pet_food_items" ADD CONSTRAINT "pet_food_items_pet_id_pets_id_fk" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE set null ON UPDATE no action;

CREATE INDEX IF NOT EXISTS "inventory_user_location_idx" ON "inventory_items" USING btree ("user_id","location");
CREATE INDEX IF NOT EXISTS "inventory_user_expires_idx" ON "inventory_items" USING btree ("user_id","expires_on");
CREATE INDEX IF NOT EXISTS "recipe_ideas_user_created_idx" ON "recipe_ideas" USING btree ("user_id","created_at");
CREATE INDEX IF NOT EXISTS "meal_plans_user_date_idx" ON "meal_plans" USING btree ("user_id","planned_date");
CREATE INDEX IF NOT EXISTS "meal_plans_user_updated_idx" ON "meal_plans" USING btree ("user_id","updated_at");
CREATE INDEX IF NOT EXISTS "pets_user_created_idx" ON "pets" USING btree ("user_id","created_at");
CREATE INDEX IF NOT EXISTS "pet_food_user_updated_idx" ON "pet_food_items" USING btree ("user_id","updated_at");
CREATE INDEX IF NOT EXISTS "pet_food_user_pet_idx" ON "pet_food_items" USING btree ("user_id","pet_id");

ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "pets_enabled" boolean DEFAULT false NOT NULL;
