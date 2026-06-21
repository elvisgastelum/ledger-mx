import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

/**
 * Database type using Drizzle ORM with our schema.
 */
export type Database = NodePgDatabase<typeof schema>;

/**
 * Creates a Drizzle database instance using a PostgreSQL connection string.
 *
 * @param connectionString - PostgreSQL connection string (defaults to DATABASE_URL env)
 * @returns Drizzle database instance
 * @throws Error if connection string is missing
 */
export function createDatabase(connectionString?: string): Database {
  const connStr = connectionString ?? process.env.DATABASE_URL;

  if (!connStr) {
    throw new Error(
      "Database connection string is required. " +
        "Provide DATABASE_URL environment variable or pass connectionString parameter.",
    );
  }

  const pool = new Pool({
    connectionString: connStr,
  });

  return drizzle(pool, { schema });
}

// Re-export schema for convenience
export * from "./schema";
