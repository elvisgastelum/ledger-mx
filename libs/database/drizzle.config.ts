import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";
import path from "node:path";

// drizzle-kit loads this config as CJS, so __dirname is available at runtime.
// Using @ts-ignore because TypeScript doesn't recognize CJS globals in ESM context.
// @ts-ignore
const rootDir = path.resolve(__dirname, "..", "..");
dotenv.config({ path: path.join(rootDir, ".env") });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL environment variable is required.\n" +
    "Copy .env.example to .env and ensure the following are set:\n" +
    "  - POSTGRES_DB (database name)\n" +
    "  - POSTGRES_USER (database user)\n" +
    "  - POSTGRES_PASSWORD (database password)\n" +
    "  - POSTGRES_PORT (database port, default 5432)\n" +
    "  - DATABASE_URL (full connection string, must match POSTGRES_* values)\n" +
    "See .env.example for the required format.",
  );
}

export default defineConfig({
  driver: "pg",
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dbCredentials: {
    connectionString: databaseUrl,
  },
  strict: true,
  verbose: true,
});
