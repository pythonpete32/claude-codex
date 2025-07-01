/**
 * @fileoverview Session management routes
 * @module @dao/codex-api-server/routes/sessions
 */

import { Elysia, t } from "elysia";
import { config } from "../config";
import { HistoryReader } from "../services/history-reader";
import { SessionScanner } from "../services/session-scanner";

/**
 * Create session management routes
 */
export function createSessionRoutes() {
	// Initialize session scanner
	const scanner = new SessionScanner({
		logsPath: config.claudeLogsPath,
		activeThreshold: config.activeSessionThreshold,
	});

	const app = new Elysia({ prefix: "/sessions" })
		// Inject scanner into context
		.decorate("scanner", scanner)

		// GET /sessions - List all sessions with filtering and pagination
		.get(
			"/",
			async ({ query, set }) => {
				try {
					const { active, project, limit, offset } = query;

					// Validate pagination parameters
					const validatedLimit = Math.min(
						Math.max(Number(limit) || 50, 1),
						config.maxEntriesPerRequest,
					);
					const validatedOffset = Math.max(Number(offset) || 0, 0);

					// Get sessions
					const result = await scanner.getAllSessions({
						limit: validatedLimit,
						offset: validatedOffset,
						active: active === "true",
						project: project || undefined,
					});

					return {
						sessions: result.data,
						pagination: {
							total: result.total,
							limit: result.limit,
							offset: result.offset,
							hasMore: result.hasMore,
						},
					};
				} catch (error) {
					console.error("Error getting sessions:", error);
					set.status = 500;
					return {
						error: "INTERNAL_ERROR",
						message: "Failed to retrieve sessions",
						timestamp: new Date().toISOString(),
					};
				}
			},
			{
				query: t.Object({
					active: t.Optional(t.String()),
					project: t.Optional(t.String()),
					limit: t.Optional(t.String()),
					offset: t.Optional(t.String()),
				}),
				detail: {
					summary: "List sessions",
					description:
						"Get all Claude conversation sessions with optional filtering and pagination",
					tags: ["sessions"],
					responses: {
						200: {
							description: "Sessions retrieved successfully",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											sessions: {
												type: "array",
												items: {
													type: "object",
													properties: {
														id: { type: "string" },
														projectPath: { type: "string" },
														lastActivity: { type: "string" },
														messageCount: { type: "number" },
														hasToolUsage: { type: "boolean" },
														isActive: { type: "boolean" },
														createdAt: { type: "string" },
														fileSize: { type: "number" },
													},
												},
											},
											pagination: {
												type: "object",
												properties: {
													total: { type: "number" },
													limit: { type: "number" },
													offset: { type: "number" },
													hasMore: { type: "boolean" },
												},
											},
										},
									},
								},
							},
						},
						500: {
							description: "Internal server error",
						},
					},
				},
			},
		)

		// GET /sessions/:id - Get session details
		.get(
			"/:id",
			async ({ params, set }) => {
				try {
					const { id } = params;

					// Validate session ID format (should be UUID)
					const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
					if (!uuidRegex.test(id)) {
						set.status = 400;
						return {
							error: "INVALID_SESSION_ID",
							message: "Session ID must be a valid UUID",
							timestamp: new Date().toISOString(),
						};
					}

					// Get session
					const session = await scanner.getSessionById(id);

					if (!session) {
						set.status = 404;
						return {
							error: "SESSION_NOT_FOUND",
							message: `Session ${id} not found`,
							timestamp: new Date().toISOString(),
						};
					}

					return session;
				} catch (error) {
					console.error(`Error getting session ${params.id}:`, error);
					set.status = 500;
					return {
						error: "INTERNAL_ERROR",
						message: "Failed to retrieve session",
						timestamp: new Date().toISOString(),
					};
				}
			},
			{
				params: t.Object({
					id: t.String(),
				}),
				detail: {
					summary: "Get session details",
					description: "Retrieve detailed information about a specific session",
					tags: ["sessions"],
					responses: {
						200: {
							description: "Session details retrieved successfully",
						},
						400: {
							description: "Invalid session ID format",
						},
						404: {
							description: "Session not found",
						},
						500: {
							description: "Internal server error",
						},
					},
				},
			},
		)

		// GET /sessions/:id/history - Get session conversation history
		.get(
			"/:id/history",
			async ({ params, query, set }) => {
				try {
					const { id } = params;
					const { limit, offset, type, since } = query;

					// Validate session ID format
					const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
					if (!uuidRegex.test(id)) {
						set.status = 400;
						return {
							error: "INVALID_SESSION_ID",
							message: "Session ID must be a valid UUID",
							timestamp: new Date().toISOString(),
						};
					}

					// Check if session exists
					const session = await scanner.getSessionById(id);
					if (!session) {
						set.status = 404;
						return {
							error: "SESSION_NOT_FOUND",
							message: `Session ${id} not found`,
							timestamp: new Date().toISOString(),
						};
					}

					// Validate pagination parameters
					const validatedLimit = Math.min(
						Math.max(Number(limit) || 100, 1),
						config.maxEntriesPerRequest,
					);
					const validatedOffset = Math.max(Number(offset) || 0, 0);

					// Validate type parameter
					if (type && type !== "user" && type !== "assistant") {
						set.status = 400;
						return {
							error: "INVALID_TYPE",
							message: "Type must be 'user' or 'assistant'",
							timestamp: new Date().toISOString(),
						};
					}

					// Validate since parameter
					if (since && Number.isNaN(Date.parse(since))) {
						set.status = 400;
						return {
							error: "INVALID_SINCE",
							message: "Since must be a valid ISO timestamp",
							timestamp: new Date().toISOString(),
						};
					}

					// Get session file path from monitor
					const filePath = await scanner.getSessionFilePath(id);
					if (!filePath) {
						set.status = 404;
						return {
							error: "SESSION_FILE_NOT_FOUND",
							message: `Session file for ${id} not found`,
							timestamp: new Date().toISOString(),
						};
					}

					// Read history
					const result = await HistoryReader.getSessionHistory(filePath, {
						limit: validatedLimit,
						offset: validatedOffset,
						type: type as "user" | "assistant" | undefined,
						since,
					});

					return {
						history: result.data,
						pagination: {
							total: result.total,
							limit: result.limit,
							offset: result.offset,
							hasMore: result.hasMore,
						},
						session: {
							id: session.id,
							projectPath: session.projectPath,
						},
					};
				} catch (error) {
					console.error(`Error getting session history ${params.id}:`, error);
					set.status = 500;
					return {
						error: "INTERNAL_ERROR",
						message: "Failed to retrieve session history",
						timestamp: new Date().toISOString(),
					};
				}
			},
			{
				params: t.Object({
					id: t.String(),
				}),
				query: t.Object({
					limit: t.Optional(t.String()),
					offset: t.Optional(t.String()),
					type: t.Optional(t.String()),
					since: t.Optional(t.String()),
				}),
				detail: {
					summary: "Get session history",
					description:
						"Retrieve conversation history for a specific session with pagination and filtering",
					tags: ["sessions"],
					responses: {
						200: {
							description: "Session history retrieved successfully",
						},
						400: {
							description: "Invalid request parameters",
						},
						404: {
							description: "Session not found",
						},
						500: {
							description: "Internal server error",
						},
					},
				},
			},
		)

		// Cleanup on app destroy
		.onStop(() => {
			scanner.destroy();
		});

	return app;
}
