import { generateOpenApi } from "@ts-rest/open-api";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { contract } from "./contract";

/**
 * Generated OpenAPI 3.0 document from the ts-rest contract.
 * This serves as the single source of truth for API documentation.
 *
 * NOTE: Paths with path parameters (e.g., /category-groups/:id) are converted
 * to OpenAPI syntax (/category-groups/{id}) by @ts-rest/open-api automatically.
 */
export const openApiDocument = generateOpenApi(contract, {
  info: {
    title: "LedgerMx API",
    version: "1.0.0",
    description: `
LedgerMx API - Personal Finance Management

This API provides endpoints for:
- User authentication (register, login, refresh, logout)
- Category group management (list, create, update, delete)
- Onboarding (apply default layout)
- Reports (planned: spendable balance, expenses by category, debt progress)
- Export (planned: CSV download)
- Health checks (planned: liveness and readiness probes)

## Authentication

Most endpoints require authentication via JWT access tokens. Include the token in the Authorization header:
\`\`\`
Authorization: Bearer <access_token>
\`\`\`

Refresh tokens are handled via httpOnly cookies (primary) or optional body parameter.

## Implemented Endpoints

Endpoints marked with "implemented: true" in the contract metadata are available in the current release.
Planned endpoints are included in this spec for documentation purposes but return 501 Not Implemented.
    `.trim(),
  },
  openapi: "3.0.0",
  servers: [
    {
      url: "http://localhost:3000",
      description: "Local development server",
    },
    {
      url: "https://api.ledgermx.com",
      description: "Production server",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "JWT access token (obtained from /auth/login or /auth/register)",
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
});

/**
 * Calculate the repository root directory from the current file's location.
 * This file is expected to be at: <repo-root>/libs/contracts/src/openapi.ts
 */
function getRepoRoot(): string {
  // import.meta.url is a file:// URL, convert to filesystem path
  const currentFilePath = dirname(fileURLToPath(import.meta.url));
  // Navigate from libs/contracts/src/ to repo root (go up 3 levels)
  return resolve(currentFilePath, "../../..");
}

/**
 * Helper function to write the OpenAPI document to a file.
 * Intended for use in scripts or build tools.
 * 
 * @param outputPath - File path for output. If relative, resolves from repo root.
 *                     If absolute, uses as-is.
 */
export async function writeOpenApiJson(outputPath: string): Promise<void> {
  const fs = await import("fs/promises");
  const path = await import("path");

  let resolvedPath: string;
  if (path.isAbsolute(outputPath)) {
    resolvedPath = outputPath;
  } else {
    // Resolve relative paths from the repository root
    const repoRoot = getRepoRoot();
    resolvedPath = path.resolve(repoRoot, outputPath);
  }

  const dir = path.dirname(resolvedPath);

  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(resolvedPath, JSON.stringify(openApiDocument, null, 2), "utf-8");

  console.log(`OpenAPI document written to: ${resolvedPath}`);
}

/**
 * CLI entry point for generating the OpenAPI JSON artifact.
 * Usage: tsx libs/contracts/src/openapi.generate.ts
 *    or: node --loader tsx libs/contracts/src/openapi.generate.ts
 */
async function main(): Promise<void> {
  const outputPath = process.argv[2] ?? "docs/mvp/api/openapi.json";
  await writeOpenApiJson(outputPath);
}

// Run if this file is executed directly (not imported)
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("Failed to generate OpenAPI document:", error);
    process.exit(1);
  });
}
