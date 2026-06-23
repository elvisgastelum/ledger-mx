/**
 * ts-rest React Query client setup.
 * Creates a typed client for making API requests using the @ledger-mx/contracts contract.
 * Uses @ts-rest/react-query/v5 for React Query v5 compatibility.
 * Includes credentials: 'include' and dynamic Authorization header.
 */
import { initTsrReactQuery } from "@ts-rest/react-query/v5";
import { contract } from "@ledger-mx/contracts";

type TsrClient = ReturnType<typeof initTsrReactQuery>;

/**
 * Creates a ts-rest React Query client with authentication support.
 * The client is configured with baseUrl from environment and dynamic Authorization header.
 *
 * @param getToken - Function that returns the current access token or null
 * @returns Configured tsr client with React Query provider and hooks
 */
export function createTsrClient(getToken: () => string | null): TsrClient {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

  return initTsrReactQuery(contract as any, {
    baseUrl,
    baseHeaders: {},
    api: async (args) => {
      const token = getToken();

      // Build headers with Authorization if token exists (avoid Bearer null/undefined)
      const headers = new Headers(args.headers);
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      // Make the fetch request with credentials: 'include'
      const response = await fetch(args.path, {
        ...args,
        headers,
        credentials: "include",
      });

      // Parse response - handle empty bodies and non-JSON responses
      let data: unknown = null;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        try {
          data = await response.json();
        } catch {
          // Empty or invalid JSON body
          data = null;
        }
      } else if (response.status !== 204) {
        // Non-JSON response and not 204 No Content
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
    },
  });
}

// Create a default client instance for use in the provider
const defaultClient = createTsrClient(() => null);

// Export the ReactQueryProvider from the ts-rest client
export const TsRestReactQueryProvider = defaultClient.ReactQueryProvider;

/**
 * Helper to create a token getter that reads from AuthContext or localStorage.
 * This avoids importing AuthContext at module level.
 */
export function createTokenGetter(
  getToken: () => string | null,
): () => string | null {
  return getToken;
}
