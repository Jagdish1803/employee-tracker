// 3. Fix src/providers/QueryProvider.tsx - Remove devtools in production
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes - longer for better caching
            gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
            retry: 2, // Reasonable retries
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            refetchOnWindowFocus: false,
            refetchOnMount: true,
            refetchOnReconnect: 'always',
            // Network mode for offline support
            networkMode: 'online',
          },
          mutations: {
            retry: 1, // One retry for mutations
            retryDelay: 1000,
            // Network mode for offline support
            networkMode: 'online',
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}