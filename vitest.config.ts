import { defineConfig, configDefaults } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    exclude: [...configDefaults.exclude, "apps/web/**"],
  },
  resolve: {
    alias: {
      "@ledger-mx/domain": resolve(__dirname, "libs/domain/src/index.ts"),
      "@ledger-mx/application": resolve(
        __dirname,
        "libs/application/src/index.ts",
      ),
      "@ledger-mx/database": resolve(__dirname, "libs/database/src/index.ts"),
      "@ledger-mx/contracts": resolve(__dirname, "libs/contracts/src/index.ts"),
      "@ledger-mx/sync": resolve(__dirname, "libs/sync/src/index.ts"),
      "@ledger-mx/testing": resolve(__dirname, "libs/testing/src/index.ts"),
      "@ledger-mx/ui": resolve(__dirname, "libs/ui/src/index.ts"),
      "@ledger-mx/infrastructure": resolve(__dirname, "libs/infrastructure/src/index.ts"),
    },
  },
});
