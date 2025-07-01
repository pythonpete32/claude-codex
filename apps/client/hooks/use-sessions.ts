import { useQuery, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/query-keys";
import { useApiClient } from "@/hooks/use-api-client";
import type { SessionInfo, SessionsQueryParams, SessionsResponse } from "@/types/api";

/**
 * Hook to fetch all sessions with optional filtering
 * @param params - Optional query parameters for filtering and pagination
 * @returns Query result with sessions data
 */
export function useSessions(params?: SessionsQueryParams) {
	const apiClient = useApiClient();

	return useQuery<SessionsResponse, Error>({
		queryKey: QUERY_KEYS.sessions(params),
		queryFn: () => apiClient.getSessions(params),
		staleTime: 30_000, // 30 seconds
	});
}

/**
 * Hook to fetch sessions with custom configuration
 * Useful for different stale times or other query options
 */
export function useSessionsWithConfig(
	params?: SessionsQueryParams,
	config?: {
		staleTime?: number;
		gcTime?: number;
		refetchInterval?: number;
		refetchOnWindowFocus?: boolean;
		enabled?: boolean;
	},
) {
	const apiClient = useApiClient();

	return useQuery<SessionsResponse, Error>({
		queryKey: QUERY_KEYS.sessions(params),
		queryFn: () => apiClient.getSessions(params),
		...config,
	});
}

/**
 * Hook to fetch sessions for a specific project
 * @param encodedPath - The encoded project path
 * @param params - Optional query parameters
 * @returns Query result with project sessions
 */
export function useProjectSessions(encodedPath: string | undefined, params?: SessionsQueryParams) {
	const apiClient = useApiClient();

	return useQuery<SessionsResponse, Error>({
		queryKey: QUERY_KEYS.projectSessions(encodedPath || "", params),
		queryFn: () => {
			if (!encodedPath) {
				throw new Error("encodedPath is required");
			}
			return apiClient.getProjectSessions(encodedPath, params);
		},
		enabled: !!encodedPath,
		staleTime: 30_000,
	});
}

/**
 * Hook to fetch a single session by ID
 * @param sessionId - The session ID
 * @returns Query result with session details
 */
export function useSession(sessionId: string | undefined) {
	const apiClient = useApiClient();

	return useQuery<SessionInfo, Error>({
		queryKey: QUERY_KEYS.session(sessionId || ""),
		queryFn: () => {
			if (!sessionId) {
				throw new Error("sessionId is required");
			}
			return apiClient.getSession(sessionId);
		},
		enabled: !!sessionId,
		staleTime: 60_000, // 1 minute
	});
}

/**
 * Hook to fetch active sessions with auto-refresh
 * @param refreshInterval - Interval in milliseconds to refresh (default: 30s)
 * @returns Query result with active sessions
 */
export function useActiveSessions(refreshInterval = 30_000) {
	const apiClient = useApiClient();

	return useQuery<SessionsResponse, Error>({
		queryKey: QUERY_KEYS.sessions({ active: true }),
		queryFn: () => apiClient.getSessions({ active: true }),
		staleTime: 10_000, // 10 seconds for active sessions
		refetchInterval: refreshInterval,
		refetchIntervalInBackground: true,
	});
}

/**
 * Hook to prefetch session data
 * Useful for preloading on hover
 */
export function usePrefetchSession() {
	const queryClient = useQueryClient();
	const apiClient = useApiClient();

	return (sessionId: string) => {
		return queryClient.prefetchQuery({
			queryKey: QUERY_KEYS.session(sessionId),
			queryFn: () => apiClient.getSession(sessionId),
			staleTime: 60_000,
		});
	};
}

/**
 * Hook to invalidate session queries
 * Useful after mutations or real-time updates
 */
export function useInvalidateSessions() {
	const queryClient = useQueryClient();

	return {
		invalidateAll: () => {
			queryClient.invalidateQueries({
				queryKey: QUERY_KEYS.sessions(),
			});
		},
		invalidateProject: (encodedPath: string) => {
			queryClient.invalidateQueries({
				queryKey: QUERY_KEYS.projectSessions(encodedPath),
			});
		},
		invalidateSession: (sessionId: string) => {
			queryClient.invalidateQueries({
				queryKey: QUERY_KEYS.session(sessionId),
			});
		},
	};
}
