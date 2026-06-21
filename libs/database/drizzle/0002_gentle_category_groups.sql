-- Migration: Add category_groups table and update categories with required category_group_id

-- Create enum type for category_group_kind (idempotent)
DO $$ BEGIN
  CREATE TYPE "category_group_kind" AS ENUM ('income', 'expense', 'savings', 'general');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create category_groups table
CREATE TABLE IF NOT EXISTS "category_groups" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"kind" "category_group_kind" NOT NULL,
	"ideal_percentage_basis_points" integer,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint

-- Add foreign key constraint for user_id on category_groups
DO $$ BEGIN
  ALTER TABLE "category_groups" ADD CONSTRAINT "category_groups_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create indexes for category_groups
CREATE INDEX IF NOT EXISTS "category_groups_user_id_idx" ON "category_groups" ("user_id");
CREATE INDEX IF NOT EXISTS "category_groups_user_kind_idx" ON "category_groups" ("user_id", "kind");
CREATE INDEX IF NOT EXISTS "category_groups_user_sort_idx" ON "category_groups" ("user_id", "sort_order");
CREATE INDEX IF NOT EXISTS "category_groups_deleted_at_idx" ON "category_groups" ("deleted_at");
CREATE INDEX IF NOT EXISTS "category_groups_user_deleted_idx" ON "category_groups" ("user_id", "deleted_at");
--> statement-breakpoint

-- Add nullable category_group_id column to categories
ALTER TABLE "categories" ADD COLUMN "category_group_id" uuid;
--> statement-breakpoint

-- Create system "General" category group for each user who has categories
INSERT INTO "category_groups" ("id", "user_id", "name", "kind", "ideal_percentage_basis_points", "sort_order", "is_system", "created_at", "updated_at")
SELECT 
  gen_random_uuid() as id,
  c."user_id" as user_id,
  'General' as name,
  'general' as kind,
  null as ideal_percentage_basis_points,
  0 as sort_order,
  true as is_system,
  now() as created_at,
  now() as updated_at
FROM "categories" c
WHERE c."deleted_at" IS NULL
GROUP BY c."user_id"
ON CONFLICT DO NOTHING;
--> statement-breakpoint

-- Update existing categories to point to their user's General category group
UPDATE "categories" c
SET "category_group_id" = cg."id"
FROM "category_groups" cg
WHERE c."user_id" = cg."user_id"
  AND cg."name" = 'General'
  AND cg."is_system" = true;
--> statement-breakpoint

-- Make category_group_id NOT NULL
ALTER TABLE "categories" ALTER COLUMN "category_group_id" SET NOT NULL;
--> statement-breakpoint

-- Add foreign key constraint for category_group_id
DO $$ BEGIN
  ALTER TABLE "categories" ADD CONSTRAINT "categories_category_group_id_category_groups_id_fk" FOREIGN KEY ("category_group_id") REFERENCES "category_groups"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create index for categories.category_group_id
CREATE INDEX IF NOT EXISTS "categories_group_id_idx" ON "categories" ("category_group_id");
