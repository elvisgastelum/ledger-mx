/**
 * Tests for api-client.ts
 * Verifies that all auth API calls use credentials: 'include'
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { registerApi, loginApi, refreshApi, logoutApi } from "../lib/api-client";

describe("api-client", () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          accessToken: "test-token",
          sessionId: "test-session",
          user: { id: "test-id", email: "test@example.com" },
        }),
    } as Response);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe("registerApi", () => {
    it("should call fetch with credentials: 'include'", async () => {
      await registerApi({
        email: "test@example.com",
        password: "Test123!@#",
        displayName: "Test User",
      });

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/v1/auth/register",
        expect.objectContaining({
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        })
      );
    });
  });

  describe("loginApi", () => {
    it("should call fetch with credentials: 'include'", async () => {
      await loginApi({
        email: "test@example.com",
        password: "Test123!@#",
      });

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/v1/auth/login",
        expect.objectContaining({
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        })
      );
    });
  });

  describe("refreshApi", () => {
    it("should call fetch with credentials: 'include'", async () => {
      await refreshApi();

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/v1/auth/refresh",
        expect.objectContaining({
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        })
      );
    });
  });

  describe("logoutApi", () => {
    it("should call fetch with credentials: 'include'", async () => {
      await logoutApi();

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/v1/auth/logout",
        expect.objectContaining({
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        })
      );
    });
  });

  describe("error handling", () => {
    it("should throw an error with message from ErrorResponse", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: () =>
          Promise.resolve({
            message: "Invalid email or password",
          }),
      } as Response);

      await expect(
        loginApi({ email: "test@example.com", password: "wrong" })
      ).rejects.toThrow("Invalid email or password");
    });

    it("should throw an error with status code if ErrorResponse parse fails", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error("Invalid JSON")),
      } as Response);

      await expect(
        loginApi({ email: "test@example.com", password: "wrong" })
      ).rejects.toThrow("Request failed with status 500");
    });
  });
});
