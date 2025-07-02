/**
 * Core API Client for Claude Codex API Server
 * Handles all communication with the backend API
 */

import type {
	ApiClientConfig,
	HealthResponse,
	ProjectsQueryParams,
	ProjectsResponse,
	SessionHistoryQueryParams,
	SessionHistoryResponse,
	SessionInfo,
	SessionsQueryParams,
	SessionsResponse,
} from "@/types/api";

import { isApiError } from "@/types/api";

/**
 * Custom error class for API-related errors
 */
export class ApiClientError extends Error {
	constructor(
		message: string,
		public status?: number,
		public code?: string,
		public originalError?: unknown,
	) {
		super(message);
		this.name = "ApiClientError";
	}
}

/**
 * Main API client class
 */
export class ApiClient {
	private baseUrl: string;
	private headers: Record<string, string>;
	private timeout: number;

	constructor(config?: Partial<ApiClientConfig>) {
		this.baseUrl =
			config?.baseUrl || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
		this.headers = {
			"Content-Type": "application/json",
			...config?.headers,
		};
		this.timeout = config?.timeout || 30000; // 30 seconds default
	}

	/**
	 * Get the current configuration
	 */
	getConfig() {
		return {
			baseUrl: this.baseUrl,
			timeout: this.timeout,
			headers: { ...this.headers },
		};
	}

	/**
	 * Make a fetch request with timeout and error handling
	 */
	private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), this.timeout);

		try {
			const response = await fetch(`${this.baseUrl}${endpoint}`, {
				...options,
				headers: {
					...this.headers,
					...options?.headers,
				},
				signal: controller.signal,
			});

			clearTimeout(timeoutId);

			const data = await response.json();

			if (!response.ok) {
				if (isApiError(data)) {
					throw new ApiClientError(data.message, response.status, data.code);
				}
				throw new ApiClientError(`API request failed: ${response.statusText}`, response.status);
			}

			return data as T;
		} catch (error) {
			clearTimeout(timeoutId);

			if (error instanceof ApiClientError) {
				throw error;
			}

			if (error instanceof Error) {
				if (error.name === "AbortError") {
					throw new ApiClientError("Request timeout", 408, "TIMEOUT", error);
				}
				throw new ApiClientError(error.message, undefined, undefined, error);
			}

			throw new ApiClientError("Unknown error occurred");
		}
	}

	/**
	 * Build query string from parameters
	 */
	private buildQueryString(params?: Record<string, any>): string {
		if (!params) return "";

		const searchParams = new URLSearchParams();
		Object.entries(params).forEach(([key, value]) => {
			if (value !== undefined && value !== null) {
				searchParams.append(key, String(value));
			}
		});

		const queryString = searchParams.toString();
		return queryString ? `?${queryString}` : "";
	}

	/**
	 * Get health status of the API
	 */
	async getHealth(): Promise<HealthResponse> {
		return this.fetch<HealthResponse>("/health");
	}

	/**
	 * Get all projects with session metadata
	 */
	async getProjects(params?: ProjectsQueryParams): Promise<ProjectsResponse> {
		const queryString = this.buildQueryString(params);
		return this.fetch<ProjectsResponse>(`/projects${queryString}`);
	}

	/**
	 * Get sessions for a specific project
	 */
	async getProjectSessions(
		encodedPath: string,
		params?: SessionsQueryParams,
	): Promise<SessionsResponse> {
		const queryString = this.buildQueryString(params);
		return this.fetch<SessionsResponse>(`/projects/${encodedPath}/sessions${queryString}`);
	}

	/**
	 * Get all sessions with optional filtering
	 */
	async getSessions(params?: SessionsQueryParams): Promise<SessionsResponse> {
		const queryString = this.buildQueryString(params);
		return this.fetch<SessionsResponse>(`/sessions${queryString}`);
	}

	/**
	 * Get detailed information about a specific session
	 */
	async getSession(sessionId: string): Promise<SessionInfo> {
		return this.fetch<SessionInfo>(`/sessions/${sessionId}`);
	}

	/**
	 * Get conversation history for a session
	 */
	async getSessionHistory(
		sessionId: string,
		params?: SessionHistoryQueryParams,
	): Promise<SessionHistoryResponse> {
		const queryString = this.buildQueryString(params);
		return this.fetch<SessionHistoryResponse>(`/sessions/${sessionId}/history${queryString}`);
	}

	/**
	 * Create a new session
	 */
	async createSession(params: {
		projectPath: string;
		metadata?: Record<string, unknown>;
	}): Promise<{ session: SessionInfo; message: string }> {
		return this.fetch<{ session: SessionInfo; message: string }>("/sessions", {
			method: "POST",
			body: JSON.stringify(params),
		});
	}

	/**
	 * Encode a project path for use in URLs
	 * Matches the server's encoding logic
	 */
	static encodeProjectPath(path: string): string {
		return path.replace(/\//g, "-").replace(/\./g, "--");
	}

	/**
	 * Decode a project path from URL format
	 * Matches the server's decoding logic
	 */
	static decodeProjectPath(encodedPath: string): string {
		return encodedPath.replace(/--/g, ".").replace(/-/g, "/");
	}
}

/**
 * Export the type guard from types
 */
export { isApiError } from "@/types/api";
