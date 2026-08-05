/**
 * TanStack Query client configuration.
 * Production-grade query client with optimized defaults.
 */

import { QueryClient } from "@tanstack/react-query";

/**
 * Create and configure the query client.
 * Uses production-optimized settings for caching, retries, and error handling.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Retry failed requests 3 times with exponential backoff
      retry: (failureCount, error) => {
        const normalizedError = error as { normalizedError?: { status: number } };
        // Don't retry on 401/403/404
        if (
          normalizedError?.normalizedError?.status === 401 ||
          normalizedError?.normalizedError?.status === 403 ||
          normalizedError?.normalizedError?.status === 404
        ) {
          return false;
        }
        return failureCount < 3;
      },
      // Stale time: 5 minutes
      staleTime: 5 * 60 * 1000,
      // Cache time: 10 minutes
      gcTime: 10 * 60 * 1000,
      // Refetch on window focus
      refetchOnWindowFocus: false,
      // Refetch on reconnect
      refetchOnReconnect: true,
      // Throw errors to error boundary
      throwOnError: false,
    },
    mutations: {
      // Retry mutations once
      retry: 1,
      // Throw errors to error boundary
      throwOnError: false,
    },
  },
});

export default queryClient;