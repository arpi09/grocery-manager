ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "nearby_sharing_enabled" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "nearby_sharing_lat" numeric(9, 6);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "nearby_sharing_lng" numeric(9, 6);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "nearby_sharing_updated_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "expiring_share_link" ADD COLUMN IF NOT EXISTS "latitude" numeric(9, 6);
--> statement-breakpoint
ALTER TABLE "expiring_share_link" ADD COLUMN IF NOT EXISTS "longitude" numeric(9, 6);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "expiring_share_link_geo_idx" ON "expiring_share_link" USING btree ("latitude", "longitude");
