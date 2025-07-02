"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { type ReactNode, useState } from "react";

/**
 * Default query client configuration
 */
const defaultQueryClientOptions = {
	defaultOptions: {
		queries: {
			// Stale time: how long data is considered fresh
			staleTime: 30 * 1000, // 30 seconds

			// Cache time: how long inactive data stays in cache
			gcTime: 5 * 60 * 1000, // 5 minutes

			// Retry configuration
			retry: (failureCount: number, error: unknown) => {
				// Don't retry on 4xx errors
				const apiError = error as { status?: number };
				if (apiError?.status && apiError.status >= 400 && apiError.status < 500) {
					return false;
				}
				// Retry up to 3 times with exponential backoff
				return failureCount < 3;
			},

			// Refetch on window focus
			refetchOnWindowFocus: true,

			// Don't refetch on reconnect by default
			refetchOnReconnect: "always" as const,
		},
		mutations: {
			// Retry failed mutations once
			retry: 1,
		},
	},
};

interface QueryProviderProps {
	children: ReactNode;
}

/**
 * React Query Provider component
 * Wraps the application with QueryClientProvider and sets up React Query
 */
export function QueryProvider({ children }: QueryProviderProps) {
	// Create a stable query client instance
	const [queryClient] = useState(() => new QueryClient(defaultQueryClientOptions));

	return (
		<QueryClientProvider client={queryClient}>
			{children}
			{/* Show React Query Devtools only in development */}
			{process.env.NODE_ENV === "development" && (
				<ReactQueryDevtools initialIsOpen={false} position="bottom" buttonPosition="bottom-right" />
			)}
		</QueryClientProvider>
	);
}
