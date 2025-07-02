/**
 * API Helper Utilities
 * Utility functions for working with the Claude Codex API
 */

import { formatDistanceToNow, parseISO } from "date-fns";
import type { ProjectInfo, SessionInfo } from "@/types/api";

/**
 * Format an ISO timestamp to a relative time string (e.g., "2 minutes ago")
 */
export function formatRelativeTime(isoTimestamp: string): string {
	try {
		const date = parseISO(isoTimestamp);
		return formatDistanceToNow(date, { addSuffix: true });
	} catch (error) {
		console.error("Error parsing timestamp:", error);
		return "Unknown";
	}
}

/**
 * Format file size in bytes to human-readable format
 */
export function formatFileSize(bytes: number): string {
	if (bytes === 0) return "0 Bytes";

	const k = 1024;
	const sizes = ["Bytes", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

/**
 * Determine the project type from the path
 * This is a heuristic based on common project structures
 */
export function getProjectType(path: string): "github" | "local" | "unknown" {
	const lowercasePath = path.toLowerCase();

	if (lowercasePath.includes("/github/") || lowercasePath.includes("/git/")) {
		return "github";
	}

	if (lowercasePath.includes("/home/") || lowercasePath.includes("/users/")) {
		return "local";
	}

	return "unknown";
}

/**
 * Extract project name from path
 */
export function getProjectName(path: string): string {
	const parts = path.split("/");
	return parts[parts.length - 1] || path;
}

/**
 * Sort projects by last activity (most recent first)
 */
export function sortProjectsByActivity(projects: ProjectInfo[]): ProjectInfo[] {
	return [...projects].sort((a, b) => {
		const dateA = new Date(a.lastActivity).getTime();
		const dateB = new Date(b.lastActivity).getTime();
		return dateB - dateA;
	});
}

/**
 * Sort sessions by last activity (most recent first)
 */
export function sortSessionsByActivity(sessions: SessionInfo[]): SessionInfo[] {
	return [...sessions].sort((a, b) => {
		const dateA = new Date(a.lastActivity).getTime();
		const dateB = new Date(b.lastActivity).getTime();
		return dateB - dateA;
	});
}

/**
 * Filter sessions by search query
 */
export function filterSessionsByQuery(sessions: SessionInfo[], query: string): SessionInfo[] {
	if (!query.trim()) return sessions;

	const lowerQuery = query.toLowerCase();
	return sessions.filter((session) => {
		// Search in session ID
		if (session.id.toLowerCase().includes(lowerQuery)) return true;

		// Search in project path
		if (session.projectPath.toLowerCase().includes(lowerQuery)) return true;

		// Search in project name
		const projectName = getProjectName(session.projectPath);
		if (projectName.toLowerCase().includes(lowerQuery)) return true;

		return false;
	});
}

/**
 * Group sessions by project path
 */
export function groupSessionsByProject(sessions: SessionInfo[]): Map<string, SessionInfo[]> {
	const grouped = new Map<string, SessionInfo[]>();

	sessions.forEach((session) => {
		const existing = grouped.get(session.projectPath) || [];
		grouped.set(session.projectPath, [...existing, session]);
	});

	return grouped;
}

/**
 * Calculate project statistics from sessions
 */
export function calculateProjectStats(sessions: SessionInfo[]): {
	totalMessages: number;
	activeCount: number;
	hasToolUsage: boolean;
	lastActivity: string | null;
} {
	if (sessions.length === 0) {
		return {
			totalMessages: 0,
			activeCount: 0,
			hasToolUsage: false,
			lastActivity: null,
		};
	}

	const totalMessages = sessions.reduce((sum, session) => sum + session.messageCount, 0);

	const activeCount = sessions.filter((s) => s.isActive).length;
	const hasToolUsage = sessions.some((s) => s.hasToolUsage);

	// Find the most recent activity
	const sortedSessions = sortSessionsByActivity(sessions);
	const lastActivity = sortedSessions[0]?.lastActivity || null;

	return {
		totalMessages,
		activeCount,
		hasToolUsage,
		lastActivity,
	};
}

/**
 * Retry a promise-returning function with exponential backoff
 */
export async function retryWithBackoff<T>(
	fn: () => Promise<T>,
	maxRetries = 3,
	initialDelay = 1000,
): Promise<T> {
	let lastError: Error;

	for (let i = 0; i < maxRetries; i++) {
		try {
			return await fn();
		} catch (error) {
			lastError = error as Error;

			if (i < maxRetries - 1) {
				const delay = initialDelay * 2 ** i;
				await new Promise((resolve) => setTimeout(resolve, delay));
			}
		}
	}

	throw lastError;
}

/**
 * Check if a session is recently active (within last 5 minutes)
 */
export function isRecentlyActive(session: SessionInfo): boolean {
	const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
	const lastActivity = new Date(session.lastActivity);
	return lastActivity > fiveMinutesAgo;
}

/**
 * Get a session status color based on its state
 */
export function getSessionStatusColor(session: SessionInfo): string {
	if (session.isActive) {
		return "text-green-500";
	}

	if (isRecentlyActive(session)) {
		return "text-yellow-500";
	}

	return "text-gray-400";
}

/**
 * Get a human-readable session status
 */
export function getSessionStatus(session: SessionInfo): string {
	if (session.isActive) {
		return "Active";
	}

	if (isRecentlyActive(session)) {
		return "Recently Active";
	}

	return "Inactive";
}

/**
 * Create a debounced version of a function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
	func: T,
	wait: number,
): (...args: Parameters<T>) => void {
	let timeout: NodeJS.Timeout;

	return (...args: Parameters<T>) => {
		clearTimeout(timeout);
		timeout = setTimeout(() => func(...args), wait);
	};
}
