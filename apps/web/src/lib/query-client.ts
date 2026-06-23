/**
 * TanStack Query client configuration.
 * Sets up default options for queries and mutations.
 */
import { QueryClient } from "@tanstack/react-query";

/**
 * Creates a configured QueryClient instance.
 * - Default stale time: 30 seconds (avoids refetching on tab focus immediately)
 * - Default gc time: 5 minutes (keeps data in cache for 5 min after unmount)
 * - Retry: 1 time on failure (avoids aggressive retries)
 * - Refetch on window focus: true (keeps data fresh)
 */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000, // 30 seconds
        gcTime: 5 * 60 * 1000, // 5 minutes
        retry: 1,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
      },
      mutations: {
        retry: 0, // Don't retry mutations by default
      },
    },
  });
}
