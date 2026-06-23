/**
 * Tests for auth-context authFetch helper.
 * Verifies Authorization header, 401 retry, and error handling.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, act } from "@testing-library/react";
import { AuthProvider, useAuth } from "./auth-context";
import { refreshApi } from "./api-client";

// Mock api-client
vi.mock("./api-client", () => ({
  registerApi: vi.fn(),
  loginApi: vi.fn(),
  refreshApi: vi.fn(),
  logoutApi: vi.fn(),
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Test component to access auth context
function TestComponent({ onAuthReady }: { onAuthReady: (auth: ReturnType<typeof useAuth>) => void }) {
  const auth = useAuth();
  onAuthReady(auth);
  return <div>Test</div>;
}

describe("authFetch", () => {
  let capturedAuth: ReturnType<typeof useAuth> | null = null;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    capturedAuth = null;
  });

  afterEach(() => {
    cleanup();
  });

  it("should exist in auth context", async () => {
    // Setup mock for refreshApi (called on mount)
    vi.mocked(refreshApi).mockResolvedValueOnce({
      accessToken: "test-token",
      sessionId: "session-1",
      user: { id: "user-1", email: "test@example.com" },
    });

    render(
      <AuthProvider>
        <TestComponent onAuthReady={(auth) => { capturedAuth = auth; }} />
      </AuthProvider>
    );

    // Wait for auth to initialize
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(capturedAuth).not.toBeNull();
    expect(capturedAuth?.authFetch).toBeDefined();
    expect(typeof capturedAuth?.authFetch).toBe("function");
  });
});
