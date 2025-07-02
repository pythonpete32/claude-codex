import { useQuery, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/query-keys";
import { useApiClient } from "@/hooks/use-api-client";
import type { ProjectsQueryParams, ProjectsResponse } from "@/types/api";

/**
 * Hook to fetch all projects with session metadata
 * @param params - Optional query parameters for pagination
 * @returns Query result with projects data
 */
export function useProjects(params?: ProjectsQueryParams) {
	const apiClient = useApiClient();

	return useQuery<ProjectsResponse, Error>({
		queryKey: QUERY_KEYS.projects(params),
		queryFn: () => apiClient.getProjects(params),
		staleTime: 30_000, // 30 seconds
		select: (data) => {
			// Sort projects by last activity by default
			if (data?.projects) {
				data.projects.sort((a, b) => {
					const dateA = new Date(a.lastActivity).getTime();
					const dateB = new Date(b.lastActivity).getTime();
					return dateB - dateA; // Most recent first
				});
			}
			return data;
		},
	});
}

/**
 * Hook to fetch projects with custom configuration
 * Useful for different stale times or other query options
 */
export function useProjectsWithConfig(
	params?: ProjectsQueryParams,
	config?: {
		staleTime?: number;
		gcTime?: number;
		refetchInterval?: number;
		enabled?: boolean;
	},
) {
	const apiClient = useApiClient();

	return useQuery<ProjectsResponse, Error>({
		queryKey: QUERY_KEYS.projects(params),
		queryFn: () => apiClient.getProjects(params),
		...config,
	});
}

/**
 * Hook to prefetch projects data
 * Useful for preloading data on hover or route changes
 */
export function usePrefetchProjects() {
	const queryClient = useQueryClient();
	const apiClient = useApiClient();

	return (params?: ProjectsQueryParams) => {
		return queryClient.prefetchQuery({
			queryKey: QUERY_KEYS.projects(params),
			queryFn: () => apiClient.getProjects(params),
			staleTime: 30_000,
		});
	};
}
