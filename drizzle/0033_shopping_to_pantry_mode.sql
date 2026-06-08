ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "shopping_to_pantry_mode" text NOT NULL DEFAULT 'ask';
