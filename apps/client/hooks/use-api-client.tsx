"use client";

import { createContext, type ReactNode, useContext } from "react";
import { ApiClient } from "@/services/api-client";

/**
 * Context for providing the API client instance
 */
const ApiClientContext = createContext<ApiClient | undefined>(undefined);

/**
 * Props for the API client provider
 */
interface ApiClientProviderProps {
	children: ReactNode;
	apiClient?: ApiClient;
}

/**
 * Provider component for the API client
 * This allows for dependency injection of the API client
 */
export function ApiClientProvider({ children, apiClient }: ApiClientProviderProps) {
	// Create a default client if none provided
	const client =
		apiClient ||
		new ApiClient({
			baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api",
		});

	return <ApiClientContext.Provider value={client}>{children}</ApiClientContext.Provider>;
}

/**
 * Hook to access the API client instance
 * @returns The API client instance
 * @throws Error if used outside of ApiClientProvider
 */
export function useApiClient() {
	const context = useContext(ApiClientContext);

	if (!context) {
		throw new Error("useApiClient must be used within an ApiClientProvider");
	}

	return context;
}

/**
 * Hook to get the current API configuration
 * Useful for debugging or displaying connection info
 */
export function useApiConfig() {
	const apiClient = useApiClient();
	const config = apiClient.getConfig();

	return {
		...config,
		isEnabled: process.env.NEXT_PUBLIC_ENABLE_API_INTEGRATION === "true",
	};
}
