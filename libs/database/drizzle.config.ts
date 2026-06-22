import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";
import path from "node:path";

// Load root .env file for DATABASE_URL
// Use process.cwd() as fallback since drizzle-kit may run from different contexts
const rootDir = path.resolve(process.cwd(), "..", "..");
dotenv.config({ path: path.join(rootDir, ".env") });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL environment variable is required. Copy .env.example to .env and set a valid DATABASE_URL.",
  );
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dbCredentials: {
    url: databaseUrl,
  },
  strict: true,
  verbose: true,
});
