import { QueryClient } from '@tanstack/react-query';

/**
 * React Query setup (04_FRONTEND §8). Server state lives here; the SPA
 * never keeps its own authoritative copy of financial or personal data.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export default queryClient;
