-- DESTRUCTIVE: clears all user-owned data. Auth switched to Clerk; existing
-- users have no clerk_id to backfill. Acceptable while pre-production.

TRUNCATE TABLE "users", "accounts", "memberships", "products", "notifications", "validations" RESTART IDENTITY CASCADE;--> statement-breakpoint

DROP TABLE "validations";--> statement-breakpoint
DROP TYPE "public"."validation_types";--> statement-breakpoint

ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_phone_number_unique";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "password";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "phone_number";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "is_phone_verified";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "is_email_verified";--> statement-breakpoint

ALTER TABLE "users" ADD COLUMN "clerk_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_clerk_id_unique" UNIQUE ("clerk_id");
