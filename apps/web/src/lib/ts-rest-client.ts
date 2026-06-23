/**
 * ts-rest React Query client setup.
 * Creates a typed client for making API requests using the @ledger-mx/contracts contract.
 * Uses @ts-rest/react-query/v5 for React Query v5 compatibility.
 * Includes credentials: 'include' and dynamic Authorization header.
 */
import { initTsrReactQuery } from "@ts-rest/react-query/v5";
import { contract } from "@ledger-mx/contracts";

/**
 * Creates a ts-rest React Query client with authentication support.
 * The client is configured with baseUrl from environment and dynamic Authorization header.
 *
 * @param getToken - Function that returns the current access token or null
 * @returns Configured tsr client with React Query provider and hooks
 */
export function createTsrClient(getToken: () => string | null) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

  return initTsrReactQuery(contract as any, {
    baseUrl,
    baseHeaders: {},
    api: async (args: any) => {
      const token = getToken();

      // Build headers with Authorization if token exists
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

      // Parse response
      const data = await response.json();
      return {
        status: response.status,
        body: data,
        headers: response.headers,
      };
    },
  });
}

/**
 * Helper to create a token getter that reads from AuthContext or localStorage.
 * This avoids importing AuthContext at module level.
 */
export function createTokenGetter(
  getToken: () => string | null
): () => string | null {
  return getToken;
}
