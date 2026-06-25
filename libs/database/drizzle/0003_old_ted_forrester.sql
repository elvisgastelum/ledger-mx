DO $$ BEGIN
 CREATE TYPE "account_status" AS ENUM('active', 'archived');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "ownership_type" AS ENUM('user', 'system');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "status" "account_status" DEFAULT 'active' NOT NULL;--> statement-breakpoint
UPDATE "accounts" SET "status" = 'archived' WHERE "is_archived" = true;--> statement-breakpoint
UPDATE "accounts" SET "status" = 'active' WHERE "is_archived" = false OR "is_archived" IS NULL;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "ownership" "ownership_type" DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "system_role" text;--> statement-breakpoint
ALTER TABLE "category_groups" ADD COLUMN "ownership" "ownership_type" DEFAULT 'user' NOT NULL;--> statement-breakpoint
UPDATE "category_groups" SET "ownership" = 'system' WHERE "is_system" = true;--> statement-breakpoint
UPDATE "category_groups" SET "ownership" = 'user' WHERE "is_system" = false OR "is_system" IS NULL;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "ownership" "ownership_type" DEFAULT 'user' NOT NULL;--> statement-breakpoint
UPDATE "categories" SET "ownership" = 'system' WHERE "is_system" = true;--> statement-breakpoint
UPDATE "categories" SET "ownership" = 'user' WHERE "is_system" = false OR "is_system" IS NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "accounts_user_id_ownership_idx" ON "accounts" ("user_id","ownership");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "accounts_user_id_system_role_idx" ON "accounts" ("user_id","system_role");--> statement-breakpoint
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'accounts' AND column_name = 'is_system') THEN
    UPDATE "accounts" SET "ownership" = 'system' WHERE "is_system" = true;
    UPDATE "accounts" SET "ownership" = 'user' WHERE "is_system" = false OR "is_system" IS NULL;
  END IF;
END $$;--> statement-breakpoint
ALTER TABLE "accounts" DROP COLUMN IF EXISTS "is_archived";--> statement-breakpoint
ALTER TABLE "accounts" DROP COLUMN IF EXISTS "is_system";--> statement-breakpoint
ALTER TABLE "category_groups" DROP COLUMN IF EXISTS "is_system";--> statement-breakpoint
ALTER TABLE "categories" DROP COLUMN IF EXISTS "is_system";