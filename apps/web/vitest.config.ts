import { defineConfig, configDefaults } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
    restoreMocks: true,
    include: [
      "src/**/*.test.tsx",
      "src/**/*.test.ts",
      "src/**/*.spec.tsx",
      "src/**/*.spec.ts",
    ],
    exclude: [...configDefaults.exclude, "e2e/**", "**/e2e/**"],
    pool: "threads",
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
