CREATE TYPE "public"."account_type" AS ENUM('personal', 'org');--> statement-breakpoint
CREATE TYPE "public"."membership_role" AS ENUM('owner', 'admin', 'member');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"type" "account_type" NOT NULL,
	"name" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" "membership_role" DEFAULT 'member' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "memberships_account_user_unique" UNIQUE("account_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "account_id" text;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "account_id" text;--> statement-breakpoint

-- Backfill: one personal account + owner membership per existing user
CREATE TEMP TABLE _user_account_map (
	user_id text NOT NULL,
	account_id text NOT NULL
);--> statement-breakpoint

INSERT INTO _user_account_map (user_id, account_id)
SELECT u.id, gen_random_uuid()::text
FROM "users" u;--> statement-breakpoint

INSERT INTO "accounts" (id, type, name, created_at, updated_at)
SELECT m.account_id, 'personal', u.name || '''s pantry', now(), now()
FROM _user_account_map m
JOIN "users" u ON u.id = m.user_id;--> statement-breakpoint

INSERT INTO "memberships" (id, account_id, user_id, role, created_at, updated_at)
SELECT gen_random_uuid()::text, m.account_id, m.user_id, 'owner', now(), now()
FROM _user_account_map m;--> statement-breakpoint

UPDATE "products" p
SET "account_id" = m.account_id
FROM _user_account_map m
WHERE m.user_id = p.user_id;--> statement-breakpoint

UPDATE "notifications" n
SET "account_id" = m.account_id
FROM _user_account_map m
WHERE m.user_id = n.user_id;--> statement-breakpoint

DROP TABLE _user_account_map;--> statement-breakpoint

ALTER TABLE "products" ALTER COLUMN "account_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "account_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "products_user_id_users_id_fk";--> statement-breakpoint
ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "notifications_user_id_users_id_fk";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "notifications" DROP COLUMN "user_id";
