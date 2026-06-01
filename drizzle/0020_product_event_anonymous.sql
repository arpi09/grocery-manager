-- Allow product_event rows without a user (anonymous landing / marketing funnel)
ALTER TABLE "product_event" ALTER COLUMN "user_id" DROP NOT NULL;
