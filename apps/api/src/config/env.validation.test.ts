import { describe, it, expect } from "vitest";
import { validateEnv } from "./env.validation";

const BASE_ENV = {
  DATABASE_URL: "postgresql://test:test@localhost:5432/test",
  JWT_SECRET: "test-jwt-secret-for-unit-tests-only-minimum-32-chars",
  JWT_ACCESS_TOKEN_TTL: "15m",
  AUTH_REFRESH_COOKIE_NAME: "ledger_mx_refresh_token",
  AUTH_REFRESH_COOKIE_SAME_SITE: "lax",
  CORS_ORIGIN: "http://localhost:5173",
};

describe("validateEnv - AUTH_REFRESH_COOKIE_SECURE", () => {
  it("should parse string 'false' as false", () => {
    const result = validateEnv({
      ...BASE_ENV,
      AUTH_REFRESH_COOKIE_SECURE: "false",
    });
    expect(result.AUTH_REFRESH_COOKIE_SECURE).toBe(false);
  });

  it("should parse string 'true' as true", () => {
    const result = validateEnv({
      ...BASE_ENV,
      AUTH_REFRESH_COOKIE_SECURE: "true",
    });
    expect(result.AUTH_REFRESH_COOKIE_SECURE).toBe(true);
  });

  it("should parse boolean false as false", () => {
    const result = validateEnv({
      ...BASE_ENV,
      AUTH_REFRESH_COOKIE_SECURE: false,
    });
    expect(result.AUTH_REFRESH_COOKIE_SECURE).toBe(false);
  });

  it("should parse boolean true as true", () => {
    const result = validateEnv({
      ...BASE_ENV,
      AUTH_REFRESH_COOKIE_SECURE: true,
    });
    expect(result.AUTH_REFRESH_COOKIE_SECURE).toBe(true);
  });

  it("should default to false when undefined", () => {
    const result = validateEnv(BASE_ENV);
    expect(result.AUTH_REFRESH_COOKIE_SECURE).toBe(false);
  });

  it("should be case-insensitive for string values", () => {
    const resultLower = validateEnv({
      ...BASE_ENV,
      AUTH_REFRESH_COOKIE_SECURE: "False",
    });
    expect(resultLower.AUTH_REFRESH_COOKIE_SECURE).toBe(false);

    const resultUpper = validateEnv({
      ...BASE_ENV,
      AUTH_REFRESH_COOKIE_SECURE: "TRUE",
    });
    expect(resultUpper.AUTH_REFRESH_COOKIE_SECURE).toBe(true);
  });

  it("should fail validation for invalid string values", () => {
    expect(() =>
      validateEnv({
        ...BASE_ENV,
        AUTH_REFRESH_COOKIE_SECURE: "invalid",
      }),
    ).toThrow();

    expect(() =>
      validateEnv({
        ...BASE_ENV,
        AUTH_REFRESH_COOKIE_SECURE: "0",
      }),
    ).toThrow();

    expect(() =>
      validateEnv({
        ...BASE_ENV,
        AUTH_REFRESH_COOKIE_SECURE: "1",
      }),
    ).toThrow();
  });
});
