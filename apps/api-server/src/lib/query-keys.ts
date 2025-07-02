/**
 * Centralized query key management for React Query
 * This ensures consistent cache keys across the application
 */

import type { SessionHistoryQuery, SessionsQuery } from "../types/api";

// Rename for consistency
type SessionsQueryParams = SessionsQuery;
type SessionHistoryQueryParams = SessionHistoryQuery;
type ProjectsQueryParams = Record<string, unknown>;

/**
 * Query key factory for all API endpoints
 * Follows React Query's recommended pattern for query keys
 */
export const QUERY_KEYS = {
	// Root keys
	all: ["claude-codex"] as const,
	projects: (params?: ProjectsQueryParams) =>
		[...QUERY_KEYS.all, "projects", params] as const,
	sessions: (params?: SessionsQueryParams) =>
		[...QUERY_KEYS.all, "sessions", params] as const,

	// Project-specific keys
	projectSessions: (encodedPath: string, params?: SessionsQueryParams) =>
		[...QUERY_KEYS.all, "projects", encodedPath, "sessions", params] as const,

	// Session-specific keys
	session: (sessionId: string) =>
		[...QUERY_KEYS.all, "sessions", sessionId] as const,
	sessionHistory: (sessionId: string, params?: SessionHistoryQueryParams) =>
		[...QUERY_KEYS.all, "sessions", sessionId, "history", params] as const,

	// Health check
	health: () => [...QUERY_KEYS.all, "health"] as const,
} as const;

/**
 * Query key patterns for invalidation
 * Use these with queryClient.invalidateQueries
 */
export const QUERY_PATTERNS = {
	// Invalidate all queries
	all: QUERY_KEYS.all,

	// Invalidate all project queries
	allProjects: [...QUERY_KEYS.all, "projects"] as const,

	// Invalidate all session queries
	allSessions: [...QUERY_KEYS.all, "sessions"] as const,

	// Invalidate specific project's sessions
	projectSessions: (encodedPath: string) =>
		[...QUERY_KEYS.all, "projects", encodedPath] as const,

	// Invalidate specific session and its history
	session: (sessionId: string) =>
		[...QUERY_KEYS.all, "sessions", sessionId] as const,
} as const;

/**
 * Helper to create query keys with consistent structure
 * @param segments - Array of key segments
 * @returns Readonly query key array
 */
export function createQueryKey<T extends ReadonlyArray<unknown>>(
	...segments: T
): Readonly<T> {
	return segments as Readonly<T>;
}

/**
 * Type-safe query key builder
 * Ensures all query keys follow the same structure
 */
export class QueryKeyBuilder {
	private segments: unknown[] = [];

	constructor(root: string | readonly string[]) {
		this.segments = Array.isArray(root) ? [...root] : [root];
	}

	add(segment: unknown): this {
		this.segments.push(segment);
		return this;
	}

	addIf(condition: boolean, segment: unknown): this {
		if (condition) {
			this.segments.push(segment);
		}
		return this;
	}

	build(): readonly unknown[] {
		return [...this.segments];
	}
}

/**
 * Example usage:
 *
 * const key = new QueryKeyBuilder(QUERY_KEYS.all)
 *   .add('projects')
 *   .addIf(hasFilter, filter)
 *   .build();
 */
