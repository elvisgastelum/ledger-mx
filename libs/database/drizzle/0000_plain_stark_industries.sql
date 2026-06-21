DO $$ BEGIN
 CREATE TYPE "account_type" AS ENUM('debit', 'credit', 'loan', 'savings', 'cash');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "transaction_line_target_type" AS ENUM('account', 'envelope', 'category');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "transaction_type" AS ENUM('income', 'expense', 'transfer', 'adjustment', 'reversal', 'debt_payment');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"display_name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "accounts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" "account_type" NOT NULL,
	"currency_code" text DEFAULT 'USD' NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "envelopes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"target_amount_cents" integer,
	"is_protected" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "categories" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"parent_id" uuid,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "transactions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "transaction_type" NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"description" text,
	"external_id" text,
	"reversal_of_transaction_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "transaction_lines" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"transaction_id" uuid NOT NULL,
	"target_type" "transaction_line_target_type" NOT NULL,
	"account_id" uuid,
	"envelope_id" uuid,
	"category_id" uuid,
	"amount_cents" integer NOT NULL,
	"memo" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "accounts_user_id_idx" ON "accounts" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "accounts_user_id_type_idx" ON "accounts" ("user_id","type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "envelopes_user_id_idx" ON "envelopes" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "categories_user_id_idx" ON "categories" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "categories_parent_id_idx" ON "categories" ("parent_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transactions_user_id_idx" ON "transactions" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transactions_user_id_occurred_at_idx" ON "transactions" ("user_id","occurred_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transactions_reversal_of_transaction_id_idx" ON "transactions" ("reversal_of_transaction_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transaction_lines_user_id_idx" ON "transaction_lines" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transaction_lines_transaction_id_idx" ON "transaction_lines" ("transaction_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transaction_lines_account_id_idx" ON "transaction_lines" ("account_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transaction_lines_envelope_id_idx" ON "transaction_lines" ("envelope_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transaction_lines_category_id_idx" ON "transaction_lines" ("category_id");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "envelopes" ADD CONSTRAINT "envelopes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "categories" ADD CONSTRAINT "categories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transactions" ADD CONSTRAINT "transactions_reversal_of_transaction_id_transactions_id_fk" FOREIGN KEY ("reversal_of_transaction_id") REFERENCES "transactions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transaction_lines" ADD CONSTRAINT "transaction_lines_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transaction_lines" ADD CONSTRAINT "transaction_lines_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transaction_lines" ADD CONSTRAINT "transaction_lines_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transaction_lines" ADD CONSTRAINT "transaction_lines_envelope_id_envelopes_id_fk" FOREIGN KEY ("envelope_id") REFERENCES "envelopes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transaction_lines" ADD CONSTRAINT "transaction_lines_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
