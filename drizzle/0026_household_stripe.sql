ALTER TABLE "household" ADD COLUMN IF NOT EXISTS "plan_tier" text DEFAULT 'free' NOT NULL;
ALTER TABLE "household" ADD COLUMN IF NOT EXISTS "stripe_customer_id" text;
ALTER TABLE "household" ADD COLUMN IF NOT EXISTS "stripe_subscription_id" text;
ALTER TABLE "household" ADD COLUMN IF NOT EXISTS "stripe_subscription_status" text;
