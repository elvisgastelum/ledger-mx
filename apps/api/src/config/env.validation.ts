import { z } from "zod";

export const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  PORT: z.coerce.number().int().min(1).max(65535).default(3000),

  DATABASE_URL: z
    .string()
    .url({ message: "DATABASE_URL must be a valid URL" })
    .min(1, { message: "DATABASE_URL is required" }),

  JWT_SECRET: z
    .string()
    .min(32, { message: "JWT_SECRET must be at least 32 characters long for security" }),

  JWT_ACCESS_TOKEN_TTL: z.string().default("15m"),

  AUTH_REFRESH_COOKIE_NAME: z.string().default("ledger_mx_refresh_token"),

  AUTH_REFRESH_COOKIE_SECURE: z.coerce.boolean().default(false),

  AUTH_REFRESH_COOKIE_SAME_SITE: z
    .enum(["strict", "lax", "none"])
    .default("lax"),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>) {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const errors = parsed.error.errors
      .map((err) => `${err.path.join(".")}: ${err.message}`)
      .join("\n");
    throw new Error(`Environment validation failed:\n${errors}`);
  }
  return parsed.data;
}
