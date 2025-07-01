/**
 * API Response Types for Claude Codex API Server
 * These types match the response structures from the API server
 */

/**
 * Session information from the API
 */
export interface SessionInfo {
	id: string; // UUID from filename
	projectPath: string; // Decoded working directory
	lastActivity: string; // ISO timestamp
	messageCount: number; // Total messages in session
	hasToolUsage: boolean; // Whether session used tools
	isActive: boolean; // Currently active based on threshold
	createdAt: string; // ISO timestamp
	fileSize: number; // Size of the JSONL file in bytes
}

/**
 * Project information aggregated from sessions
 */
export interface ProjectInfo {
	path: string; // Original project path
	encodedPath: string; // URL-safe encoded path
	sessionCount: number; // Number of sessions in project
	lastActivity: string; // Most recent activity ISO timestamp
	hasActiveSessions: boolean; // Whether any sessions are active
	totalMessages: number; // Total messages across all sessions
	hasToolUsage: boolean; // Whether any session used tools
}

/**
 * Log entry from a Claude conversation
 */
export interface LogEntry {
	uuid: string; // Unique identifier
	parentUuid?: string; // Parent message UUID
	sessionId: string; // Session this belongs to
	timestamp: string; // ISO timestamp
	type: "user" | "assistant"; // Message type
	content: string | object; // Message content
	isSidechain?: boolean; // Whether part of a sidechain
	toolUse?: ToolUseInfo; // Tool usage information
}

/**
 * Tool usage information in a log entry
 */
export interface ToolUseInfo {
	toolName: string; // Name of the tool used
	toolId?: string; // Tool invocation ID
	input?: unknown; // Tool input parameters
	output?: unknown; // Tool output result
}

/**
 * Generic pagination wrapper for API responses
 */
export interface PaginatedResponse<T> {
	data: T[]; // Array of items
	total: number; // Total count of items
	limit: number; // Items per page
	offset: number; // Current offset
	hasMore: boolean; // Whether more pages exist
}

/**
 * Projects API response
 */
export interface ProjectsResponse {
	projects: ProjectInfo[];
	total?: number;
	limit?: number;
	offset?: number;
	hasMore?: boolean;
}

/**
 * Sessions API response
 */
export interface SessionsResponse {
	sessions: SessionInfo[];
	total?: number;
	limit?: number;
	offset?: number;
	hasMore?: boolean;
}

/**
 * Session history API response
 */
export interface SessionHistoryResponse {
	entries: LogEntry[];
	total: number;
	limit: number;
	offset: number;
	hasMore: boolean;
}

/**
 * Health check response
 */
export interface HealthResponse {
	status: "healthy" | "degraded" | "unhealthy";
	version: string;
	uptime: number;
	timestamp: string;
	services: {
		fileSystem: {
			status: "healthy" | "degraded" | "unhealthy";
			logsPath: string;
			accessible: boolean;
		};
		sessionScanner: {
			status: "healthy" | "degraded" | "unhealthy";
			activeSessions: number;
			totalSessions: number;
		};
	};
	performance: {
		averageResponseTime: number;
		requestCount: number;
		errorRate: number;
	};
	system: {
		memory: {
			used: number;
			total: number;
			percentage: number;
		};
		cpu: {
			usage: number;
		};
	};
}

/**
 * Service status in health check
 */
export interface ServiceStatus {
	status: "healthy" | "degraded" | "unhealthy";
	lastCheck: string;
	message?: string;
}

/**
 * API error response
 */
export interface ApiError {
	error: string;
	message: string;
	code?: string;
	timestamp: string;
}

/**
 * Query parameters for projects endpoint
 */
export interface ProjectsQueryParams {
	limit?: number;
	offset?: number;
}

/**
 * Query parameters for sessions endpoint
 */
export interface SessionsQueryParams {
	active?: boolean;
	project?: string;
	limit?: number;
	offset?: number;
}

/**
 * Query parameters for session history endpoint
 */
export interface SessionHistoryQueryParams {
	limit?: number;
	offset?: number;
	type?: "user" | "assistant";
	since?: string; // ISO timestamp
}

/**
 * Configuration for the API client
 */
export interface ApiClientConfig {
	baseUrl: string;
	headers?: Record<string, string>;
	timeout?: number;
}

/**
 * Type guard to check if response is an API error
 */
export function isApiError(response: unknown): response is ApiError {
	return (
		typeof response === "object" &&
		response !== null &&
		"error" in response &&
		"message" in response
	);
}
