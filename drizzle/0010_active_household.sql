ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "active_household_id" text REFERENCES "household"("id") ON DELETE SET NULL;
