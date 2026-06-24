/**
 * ts-rest React Query client setup with centralized authentication.
 * Creates a typed client for making API requests using the @ledger-mx/contracts contract.
 * Uses @ts-rest/react-query/v5 for React Query v5 compatibility.
 * Includes credentials: 'include' and dynamic Authorization header with token refresh.
 */
import { initTsrReactQuery } from "@ts-rest/react-query/v5";
import { initClient } from "@ts-rest/core";
import type { ApiFetcher } from "@ts-rest/core";
import { contract } from "@ledger-mx/contracts";
import type { AuthSuccessResponse } from "@ledger-mx/contracts";

// Auth handler types that AuthProvider will register
type GetTokenFn = () => string | null;
type RefreshFn = () => Promise<AuthSuccessResponse>;
type ClearAuthFn = () => void;

// Module-level defaults (noop/null) so hooks work before AuthProvider registers
let getTokenFn: GetTokenFn = () => null;
let refreshFn: RefreshFn = async () => {
  throw new Error("Auth not initialized");
};
let clearAuthFn: ClearAuthFn = () => {};

/**
 * Register auth handlers from AuthProvider.
 * This must be called inside AuthProvider before any ts-rest hooks are used.
 */
export function registerAuthHandlers(handlers: {
  getToken: GetTokenFn;
  refresh: RefreshFn;
  clearAuth: ClearAuthFn;
}) {
  getTokenFn = handlers.getToken;
  refreshFn = handlers.refresh;
  clearAuthFn = handlers.clearAuth;
}

/**
 * Check if a path is an auth endpoint that should not trigger token refresh.
 */
function isAuthEndpoint(path: string): boolean {
  return (
    path.includes("/auth/register") ||
    path.includes("/auth/login") ||
    path.includes("/auth/refresh") ||
    path.includes("/auth/logout")
  );
}

/**
 * Parse a Response into a standardized format.
 */
async function parseResponse(response: Response): Promise<{
  status: number;
  body: unknown;
  headers: Headers;
}> {
  let data: unknown = null;
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else if (response.status !== 204) {
    try {
      data = await response.text();
    } catch {
      data = null;
    }
  }

  return {
    status: response.status,
    body: data,
    headers: response.headers,
  };
}

/**
 * Custom API implementation with single fetch, auth headers, and 401 refresh.
 * Uses ts-rest's ApiFetcher signature for proper typing.
 */
const customApi: ApiFetcher = async (args) => {
  const makeRequest = async (token: string | null): Promise<Response> => {
    const headers = new Headers(args.headers);
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    // args.body is already serialized by ts-rest (FormData | URLSearchParams | string | null | undefined)
    const body = args.body ?? undefined;

    // Spread fetchOptions first, then explicitly set credentials last to prevent override
    return fetch(args.path, {
      method: args.method,
      headers,
      body,
      ...args.fetchOptions,
      credentials: "include",
    });
  };

  // First attempt
  let response = await makeRequest(getTokenFn());

  // Handle 401 with refresh (skip for auth endpoints)
  if (response.status === 401 && !isAuthEndpoint(args.path)) {
    try {
      await refreshFn();
      // Retry once with new token after refresh
      response = await makeRequest(getTokenFn());
      // If retry is also 401, clear auth and return parsed response
      if (response.status === 401) {
        clearAuthFn();
      }
    } catch {
      // Refresh failed, clear auth and return original 401
      clearAuthFn();
      return parseResponse(response);
    }
  }

  return parseResponse(response);
};

// Validate and resolve API base URL once for all clients
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

// Create the tsr client with custom api
export const tsr = initTsrReactQuery(contract, {
  baseUrl: apiBaseUrl,
  baseHeaders: {},
  api: customApi,
});

// Export ReactQueryProvider for use in App.tsx
export const { ReactQueryProvider } = tsr;

// Create imperative client for CSV download and other non-hook uses
export const contractClient = initClient(contract, {
  baseUrl: apiBaseUrl,
  baseHeaders: {},
  api: customApi,
});

/**
 * Helper to extract filename from Content-Disposition header.
 */
export function extractFilename(contentDisposition: string | null): string {
  if (!contentDisposition) return "transactions.csv";
  const filenameMatch = contentDisposition.match(/filename="?(.+?)"?$/);
  return filenameMatch?.[1] ?? "transactions.csv";
}
