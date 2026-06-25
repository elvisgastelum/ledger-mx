import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  {
    ignores: [
      "**/dist/**",
      "**/coverage/**",
      "**/node_modules/**",
      "**/.pnpm/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {},
  },
  // Architecture boundary: domain and application must NOT import contracts or ts-rest
  {
    files: [
      "libs/domain/src/**/*.ts",
      "libs/domain/src/**/*.tsx",
      "libs/application/src/**/*.ts",
      "libs/application/src/**/*.tsx",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@ledger-mx/contracts",
              message:
                "Domain and application layers must not import contracts. Contracts are an API boundary (outer layer).",
            },
            {
              name: "@ts-rest/core",
              message:
                "Domain and application layers must not import @ts-rest/core. Use domain models instead.",
            },
            {
              name: "@ts-rest/nest",
              message:
                "Domain and application layers must not import @ts-rest/nest. This is an infrastructure concern.",
            },
            {
              name: "@ts-rest/open-api",
              message:
                "Domain and application layers must not import @ts-rest/open-api. OpenAPI generation is an infrastructure concern.",
            },
            {
              name: "@ts-rest/react-query",
              message:
                "Domain and application layers must not import @ts-rest/react-query. This is a web/infrastructure concern.",
            },
          ],
        },
      ],
    },
  },
];
