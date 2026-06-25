import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { z } from "zod";

export default defineConfig(({ mode }) => {
  const envDir = path.resolve(__dirname, "..", "..");

  // Load env from repo root and merge with process.env (shell vars take precedence)
  const env = { ...process.env, ...loadEnv(mode, envDir, "") };

  // Zod schema for strict web environment validation
  const envSchema = z.object({
    VITE_API_BASE_URL: z.preprocess(
      (val) => (val === undefined || val === "" ? undefined : val),
      z
        .string({
          required_error: "Required",
          invalid_type_error: "Required",
        })
        .superRefine((val, ctx) => {
          try {
            const url = new URL(val);
            if (url.protocol !== "http:" && url.protocol !== "https:") {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Must use http: or https: protocol",
              });
            }
          } catch {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Must be a valid URL",
            });
          }
        }),
    ),
  });

  const result = envSchema.safeParse(env);

  if (!result.success) {
    const lines = result.error.issues.map((issue) => {
      const field =
        issue.path.length > 0 ? issue.path.join(".") : String(issue.path[0]);
      return `- ${field}: ${issue.message}`;
    });
    throw new Error(
      "Missing or invalid web environment variables:\n" + lines.join("\n"),
    );
  }

  return {
    envDir,
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 5173,
    },
  };
});
