/**
 * Tests for api-client.ts
 * Mocks global.fetch to test actual initClient transport.
 * Verifies paths, methods, credentials, body, and response handling.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { registerApi, loginApi, refreshApi, logoutApi } from "./api-client";

describe("api-client", () => {
  let originalFetch: typeof global.fetch;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    originalFetch = global.fetch;
    fetchMock = vi.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe("registerApi", () => {
    it("should POST to /api/v1/auth/register with credentials and return body on 201", async () => {
      const responseBody = {
        accessToken: "test-token",
        sessionId: "test-session",
        user: { id: "test-id", email: "test@example.com" },
      };

      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify(responseBody), {
          status: 201,
          headers: { "content-type": "application/json" },
        }),
      );

      const result = await registerApi({
        email: "test@example.com",
        password: "Test123!@#",
        displayName: "Test User",
      });

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, options] = fetchMock.mock.calls[0];

      expect(url).toMatch(/\/api\/v1\/auth\/register$/);
      expect(options?.method).toBe("POST");
      expect(options?.credentials).toBe("include");
      expect(JSON.parse(options?.body as string)).toEqual({
        email: "test@example.com",
        password: "Test123!@#",
        displayName: "Test User",
      });

      expect(result).toEqual(responseBody);
    });

    it("should throw with message from response body on non-201 status", async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Invalid email or password" }), {
          status: 400,
          headers: { "content-type": "application/json" },
        }),
      );

      await expect(
        registerApi({
          email: "test@example.com",
          password: "wrong",
        }),
      ).rejects.toThrow("Invalid email or password");
    });

    it("should throw with status code if message parse fails", async () => {
      fetchMock.mockResolvedValueOnce(new Response(null, { status: 500 }));

      await expect(
        registerApi({
          email: "test@example.com",
          password: "wrong",
        }),
      ).rejects.toThrow("Request failed with status 500");
    });
  });

  describe("loginApi", () => {
    it("should POST to /api/v1/auth/login with credentials and return body on 200", async () => {
      const responseBody = {
        accessToken: "test-token",
        sessionId: "test-session",
        user: { id: "test-id", email: "test@example.com" },
      };

      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify(responseBody), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );

      const result = await loginApi({
        email: "test@example.com",
        password: "Test123!@#",
      });

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, options] = fetchMock.mock.calls[0];

      expect(url).toMatch(/\/api\/v1\/auth\/login$/);
      expect(options?.method).toBe("POST");
      expect(options?.credentials).toBe("include");
      expect(JSON.parse(options?.body as string)).toEqual({
        email: "test@example.com",
        password: "Test123!@#",
      });

      expect(result).toEqual(responseBody);
    });

    it("should throw with message from response body on non-200 status", async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Invalid credentials" }), {
          status: 401,
          headers: { "content-type": "application/json" },
        }),
      );

      await expect(
        loginApi({
          email: "test@example.com",
          password: "wrong",
        }),
      ).rejects.toThrow("Invalid credentials");
    });
  });

  describe("refreshApi", () => {
    it("should POST to /api/v1/auth/refresh with credentials and return body on 200", async () => {
      const responseBody = {
        accessToken: "new-token",
        sessionId: "test-session",
        user: { id: "test-id", email: "test@example.com" },
      };

      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify(responseBody), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );

      const result = await refreshApi();

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, options] = fetchMock.mock.calls[0];

      expect(url).toMatch(/\/api\/v1\/auth\/refresh$/);
      expect(options?.method).toBe("POST");
      expect(options?.credentials).toBe("include");

      expect(result).toEqual(responseBody);
    });

    it("should throw with message from response body on non-200 status", async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Refresh token expired" }), {
          status: 401,
          headers: { "content-type": "application/json" },
        }),
      );

      await expect(refreshApi()).rejects.toThrow("Refresh token expired");
    });
  });

  describe("logoutApi", () => {
    it("should POST to /api/v1/auth/logout with credentials and return body on 200", async () => {
      const responseBody = { success: true };

      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify(responseBody), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );

      const result = await logoutApi();

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, options] = fetchMock.mock.calls[0];

      expect(url).toMatch(/\/api\/v1\/auth\/logout$/);
      expect(options?.method).toBe("POST");
      expect(options?.credentials).toBe("include");

      expect(result).toEqual(responseBody);
    });

    it("should throw with message from response body on non-200 status", async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Server error" }), {
          status: 401,
          headers: { "content-type": "application/json" },
        }),
      );

      await expect(logoutApi()).rejects.toThrow("Server error");
    });
  });
});
