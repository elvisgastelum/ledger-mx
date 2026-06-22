#!/usr/bin/env node
/**
 * CLI script for running database seeds.
 *
 * Usage:
 *   pnpm --filter @ledger-mx/database seed:demo
 *   pnpm --filter @ledger-mx/database seed:personal
 *   pnpm --filter @ledger-mx/database seed:reset
 *
 * Environment variables:
 *   DATABASE_URL - PostgreSQL connection string (required)
 *   SEED_ALLOW_RESET - Set to "true" to allow reset operations (required for reset)
 */

import { config } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load root .env file (from project root, not libs/database)
// cli.ts is at: libs/database/src/seeds/cli.ts
// Need to go up 4 levels: ../../../../.env
config({ path: resolve(__dirname, "../../../../.env") });

import { createDatabase } from "../connection.js";
import { seedDemo, seedPersonal, resetUser, verifySeed } from "./run.js";
import { demoUser } from "./demo.js";

const command = process.argv[2];

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("Error: DATABASE_URL environment variable is required");
    console.error("Set it in your .env file or pass it directly:");
    console.error("  DATABASE_URL=postgresql://user:pass@localhost:5432/db pnpm seed:demo");
    process.exit(1);
  }

  // Production safety guard - block all seed operations in production unless explicitly overridden
  if (process.env.NODE_ENV === "production" && !process.env.SEED_ALLOW_RESET) {
    console.error(
      "Error: Seed operations are blocked in production environment.\n" +
      "Set SEED_ALLOW_RESET=true to override this safety check.\n" +
      "This prevents accidental data modification in production.",
    );
    process.exit(1);
  }

  const db = createDatabase();

  let exitCode = 0;

  try {
    switch (command) {
      case "demo": {
        console.log("Seeding demo data...");
        await seedDemo(db);
        console.log("Demo seed completed!");
        break;
      }

      case "personal": {
        console.log("Seeding personal data...");
        await seedPersonal(db);
        console.log("Personal seed completed!");
        break;
      }

      case "reset": {
        console.log("Resetting demo user data...");
        await resetUser(db, demoUser.id);
        console.log("Reset completed!");
        break;
      }

      case "verify": {
        console.log("Verifying demo seed data...");
        const result = await verifySeed(db, demoUser.id);
        console.log("Verification results:");
        console.log(`  Users: ${result.users}`);
        console.log(`  Category Groups: ${result.categoryGroups}`);
        console.log(`  Categories: ${result.categories}`);
        console.log(`  Accounts: ${result.accounts}`);
        console.log(`  Envelopes: ${result.envelopes}`);
        console.log(`  Transactions: ${result.transactions}`);
        console.log(`  Transaction Lines: ${result.transactionLines}`);
        break;
      }

      default: {
        console.log("Usage:");
        console.log("  pnpm seed:demo      - Seed demo data");
        console.log("  pnpm seed:personal  - Seed personal data (requires personal.ts)");
        console.log("  pnpm seed:reset     - Reset demo user data (requires SEED_ALLOW_RESET=true)");
        console.log("  pnpm seed:verify    - Verify demo seed data");
        exitCode = 1;
        break;
      }
    }
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : String(error));
    exitCode = 1;
  }

  // Close database connection if needed
  // The pool will be closed when the process exits naturally
  if (exitCode !== 0) {
    process.exit(exitCode);
  }
}

main();
