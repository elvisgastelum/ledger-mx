/**
 * Seed runner for demo and personal seed data.
 *
 * This module provides functions to seed the database with demo or personal data,
 * as well as reset functionality that safely clears data for a specific user.
 *
 * Usage:
 * - `seedDemo(db)`: Seeds the database with demo data
 * - `seedPersonal(db)`: Seeds the database with personal data (requires personal.ts)
 * - `resetDemoUser(db)`: Resets all data for the demo user (safe, idempotent)
 *
 * Safety:
 * - Reset only clears data for the specific demo/personal user ID
 * - Requires SEED_ALLOW_RESET=true env var for reset operations
 * - Never clears arbitrary production data
 */

import type { Database } from "../connection.js";
import * as schema from "../schema/index.js";
import { eq } from "drizzle-orm";
import { getDemoSeedData } from "./demo.js";
import type { SeedData } from "./types.js";

/**
 * Environment variable to allow reset operations.
 * Must be explicitly set to "true" to enable resets.
 */
const SEED_ALLOW_RESET = process.env.SEED_ALLOW_RESET === "true";

/**
 * Validates that transaction lines have valid target references.
 * Each transaction line must have exactly one target FK populated,
 * and the targetType must match.
 */
export function validateTransactionLines(seedData: SeedData): void {
  for (const line of seedData.transactionLines) {
    const targets = [
      line.accountId,
      line.envelopeId,
      line.categoryId,
    ].filter(Boolean);

    if (targets.length !== 1) {
      throw new Error(
        `Transaction line ${line.id} must have exactly one target. ` +
          `Found: accountId=${line.accountId}, envelopeId=${line.envelopeId}, categoryId=${line.categoryId}`,
      );
    }

    if (line.amountCents === 0) {
      throw new Error(
        `Transaction line ${line.id} must have non-zero amountCents`,
      );
    }

    // Verify targetType matches the populated FK
    if (line.targetType === "account" && !line.accountId) {
      throw new Error(
        `Transaction line ${line.id} has targetType "account" but accountId is not set`,
      );
    }
    if (line.targetType === "envelope" && !line.envelopeId) {
      throw new Error(
        `Transaction line ${line.id} has targetType "envelope" but envelopeId is not set`,
      );
    }
    if (line.targetType === "category" && !line.categoryId) {
      throw new Error(
        `Transaction line ${line.id} has targetType "category" but categoryId is not set`,
      );
    }
  }
}

/**
 * Seeds the database with the provided seed data.
 * Inserts data in the correct order to respect foreign key constraints.
 *
 * @param db - Drizzle database instance
 * @param seedData - The seed data to insert
 */
export async function seedDatabase(
  db: Database,
  seedData: SeedData,
): Promise<void> {
  console.log("Starting seed operation...");

  // Validate seed data
  validateTransactionLines(seedData);
  console.log("Seed data validation passed");

  // Insert in order respecting FK constraints
  console.log(`Inserting ${seedData.users.length} users...`);
  for (const user of seedData.users) {
    await db.insert(schema.users).values(user).onConflictDoNothing();
  }

  console.log(
    `Inserting ${seedData.categoryGroups.length} category groups...`,
  );
  for (const cg of seedData.categoryGroups) {
    await db
      .insert(schema.categoryGroups)
      .values(cg)
      .onConflictDoNothing();
  }

  console.log(`Inserting ${seedData.categories.length} categories...`);
  for (const cat of seedData.categories) {
    await db.insert(schema.categories).values(cat).onConflictDoNothing();
  }

  console.log(`Inserting ${seedData.accounts.length} accounts...`);
  for (const acc of seedData.accounts) {
    await db.insert(schema.accounts).values(acc).onConflictDoNothing();
  }

  console.log(`Inserting ${seedData.envelopes.length} envelopes...`);
  for (const env of seedData.envelopes) {
    await db.insert(schema.envelopes).values(env).onConflictDoNothing();
  }

  console.log(`Inserting ${seedData.transactions.length} transactions...`);
  for (const tx of seedData.transactions) {
    await db.insert(schema.transactions).values(tx).onConflictDoNothing();
  }

  console.log(
    `Inserting ${seedData.transactionLines.length} transaction lines...`,
  );
  for (const line of seedData.transactionLines) {
    await db
      .insert(schema.transactionLines)
      .values(line)
      .onConflictDoNothing();
  }

  console.log("Seed operation completed successfully!");
}

/**
 * Resets all data for a specific user (safe, idempotent).
 * Only clears data belonging to the specified user ID.
 *
 * @param db - Drizzle database instance
 * @param userId - The user ID whose data should be cleared
 * @param envGuard - Whether to check SEED_ALLOW_RESET env var (default: true)
 */
export async function resetUser(
  db: Database,
  userId: string,
  envGuard = true,
): Promise<void> {
  if (envGuard && !SEED_ALLOW_RESET) {
    throw new Error(
      "Reset operation requires SEED_ALLOW_RESET=true environment variable. " +
        "This is a safety measure to prevent accidental data loss.",
    );
  }

  console.log(`Resetting all data for user ${userId}...`);

  // Delete in reverse order of FK dependencies
  // transaction_lines -> transactions -> envelopes -> accounts -> categories -> category_groups -> users

  await db
    .delete(schema.transactionLines)
    .where(eq(schema.transactionLines.userId, userId));
  console.log("  Cleared transaction lines");

  await db
    .delete(schema.transactions)
    .where(eq(schema.transactions.userId, userId));
  console.log("  Cleared transactions");

  await db
    .delete(schema.envelopes)
    .where(eq(schema.envelopes.userId, userId));
  console.log("  Cleared envelopes");

  await db.delete(schema.accounts).where(eq(schema.accounts.userId, userId));
  console.log("  Cleared accounts");

  await db
    .delete(schema.categories)
    .where(eq(schema.categories.userId, userId));
  console.log("  Cleared categories");

  await db
    .delete(schema.categoryGroups)
    .where(eq(schema.categoryGroups.userId, userId));
  console.log("  Cleared category groups");

  // Note: We don't delete the user itself, just their related data
  // If you want to delete the user as well, uncomment below:
  // await db.delete(schema.users).where(eq(schema.users.id, userId));
  // console.log("  Cleared user");

  console.log("Reset completed successfully!");
}

/**
 * Seeds the database with demo data.
 * If demo user already has data, it will be reset first (idempotent).
 *
 * @param db - Drizzle database instance
 */
export async function seedDemo(db: Database): Promise<void> {
  // Production safety guard
  if (process.env.NODE_ENV === "production" && !process.env.SEED_ALLOW_RESET) {
    throw new Error(
      "Seed operation blocked in production environment. " +
      "Set SEED_ALLOW_RESET=true to override this safety check.",
    );
  }

  const seedData = getDemoSeedData();
  const demoUserId = seedData.users[0].id;

  // Check if demo user has existing data
  const existingUser = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, demoUserId))
    .limit(1);

  if (existingUser.length > 0) {
    console.log("Demo user exists, resetting data before reseeding...");
    await resetUser(db, demoUserId, false); // Skip env guard for demo
  }

  await seedDatabase(db, seedData);
}

/**
 * Seeds the database with personal data.
 * Requires personal.ts file to exist (gitignored).
 *
 * @param db - Drizzle database instance
 */
export async function seedPersonal(db: Database): Promise<void> {
  // Production safety guard
  if (process.env.NODE_ENV === "production" && !process.env.SEED_ALLOW_RESET) {
    throw new Error(
      "Seed operation blocked in production environment. " +
      "Set SEED_ALLOW_RESET=true to override this safety check.",
    );
  }

  let personalSeedData: SeedData;

  try {
    // Dynamic import to avoid requiring personal.ts at build time
    // Using eval to prevent TypeScript from trying to resolve the module at compile time
    const modulePath = "./personal.js";
    const personalModule = await import(/* @vite-ignore */ modulePath);
    personalSeedData = personalModule.getPersonalSeedData();
  } catch (error) {
    throw new Error(
      "Personal seed file not found. " +
        "Copy personal.template.ts to personal.ts and customize it.\n" +
        "Error: " +
        (error instanceof Error ? error.message : String(error)),
    );
  }

  const personalUserId = personalSeedData.users[0].id;

  // Check if personal user has existing data
  const existingUser = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, personalUserId))
    .limit(1);

  if (existingUser.length > 0) {
    console.log("Personal user exists, resetting data before reseeding...");
    await resetUser(db, personalUserId, false); // Skip env guard for personal
  }

  await seedDatabase(db, personalSeedData);
}

/**
 * Verifies that seed data was correctly inserted.
 * Useful for testing and verification.
 *
 * @param db - Drizzle database instance
 * @param userId - The user ID to verify
 * @returns Verification result with counts
 */
export async function verifySeed(
  db: Database,
  userId: string,
): Promise<{
  users: number;
  categoryGroups: number;
  categories: number;
  accounts: number;
  envelopes: number;
  transactions: number;
  transactionLines: number;
}> {
  const users = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, userId));

  const categoryGroups = await db
    .select()
    .from(schema.categoryGroups)
    .where(eq(schema.categoryGroups.userId, userId));

  const categories = await db
    .select()
    .from(schema.categories)
    .where(eq(schema.categories.userId, userId));

  const accounts = await db
    .select()
    .from(schema.accounts)
    .where(eq(schema.accounts.userId, userId));

  const envelopes = await db
    .select()
    .from(schema.envelopes)
    .where(eq(schema.envelopes.userId, userId));

  const transactions = await db
    .select()
    .from(schema.transactions)
    .where(eq(schema.transactions.userId, userId));

  const transactionLines = await db
    .select()
    .from(schema.transactionLines)
    .where(eq(schema.transactionLines.userId, userId));

  return {
    users: users.length,
    categoryGroups: categoryGroups.length,
    categories: categories.length,
    accounts: accounts.length,
    envelopes: envelopes.length,
    transactions: transactions.length,
    transactionLines: transactionLines.length,
  };
}
