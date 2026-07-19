import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

/**
 * Shared QueryClient configuration.
 * - staleTime: 30s  — prevents re-fetching data that was just loaded
 * - gcTime: 5m      — keeps inactive cache alive for fast back-navigation
 * - retry: 1        — one automatic retry on network errors
 * - refetchOnWindowFocus: false — avoids wasteful refetches on tab switch
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export const getRouter = () => {
  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 30_000,
  });

  return router;
};
