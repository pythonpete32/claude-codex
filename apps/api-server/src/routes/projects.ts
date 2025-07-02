/**
 * @fileoverview Project management routes with path decoding
 * @module @dao/codex-api-server/routes/projects
 */

import { Elysia, t } from "elysia";
import { config } from "../config";
import { SessionScanner } from "../services/session-scanner";

/**
 * Decode Claude path encoding to original absolute path
 * Example: "-Users-abuusama-Desktop-temp--file" -> "/Users/abuusama/Desktop/temp.file"
 */
function decodePath(encodedPath: string): string {
	// Remove leading dash, then decode double-dashes to dots, then single dashes to slashes
	return (
		"/" +
		encodedPath
			.slice(1) // Remove leading dash
			.replace(/--/g, ".") // Double dashes become dots
			.replace(/-/g, "/")
	); // Single dashes become slashes
}

/**
 * Encode absolute path to Claude's encoding scheme
 * Example: "/Users/abuusama/Desktop/temp.file" -> "-Users-abuusama-Desktop-temp--file"
 */
function encodePath(path: string): string {
	// Remove leading slash, encode dots to double-dashes, slashes to dashes, add leading dash
	return (
		"-" +
		path
			.slice(1) // Remove leading slash
			.replace(/\./g, "--") // Dots become double dashes
			.replace(/\//g, "-")
	); // Slashes become single dashes
}

/**
 * Create project management routes
 */
export function createProjectRoutes() {
	// Initialize session scanner
	const scanner = new SessionScanner({
		logsPath: config.claudeLogsPath,
		activeThreshold: config.activeSessionThreshold,
	});

	const app = new Elysia({ prefix: "/projects" })
		// Inject scanner into context
		.decorate("scanner", scanner)

		// GET /projects - List all projects with session metadata
		.get(
			"/",
			async ({ query, set }) => {
				try {
					const { limit, offset } = query;

					// Validate pagination parameters
					const validatedLimit = Math.min(
						Math.max(Number(limit) || 50, 1),
						config.maxEntriesPerRequest,
					);
					const validatedOffset = Math.max(Number(offset) || 0, 0);

					// Get all sessions and group by project
					const allSessionsResult = await scanner.getAllSessions({
						limit: Number.MAX_SAFE_INTEGER,
						offset: 0,
					});

					// Group sessions by project path
					const projectMap = new Map<
						string,
						{
							path: string;
							encodedPath: string;
							sessionCount: number;
							lastActivity: string;
							hasActiveSessions: boolean;
							totalMessages: number;
							hasToolUsage: boolean;
						}
					>();

					for (const session of allSessionsResult.data) {
						const projectPath = session.projectPath;
						const encodedPath = encodePath(projectPath);

						if (!projectMap.has(projectPath)) {
							projectMap.set(projectPath, {
								path: projectPath,
								encodedPath,
								sessionCount: 0,
								lastActivity: session.lastActivity,
								hasActiveSessions: false,
								totalMessages: 0,
								hasToolUsage: false,
							});
						}

						const project = projectMap.get(projectPath);
						if (!project) continue;
						project.sessionCount++;
						project.totalMessages += session.messageCount;
						project.hasToolUsage = project.hasToolUsage || session.hasToolUsage;
						project.hasActiveSessions =
							project.hasActiveSessions || session.isActive;

						// Update last activity if this session is more recent
						if (
							new Date(session.lastActivity) > new Date(project.lastActivity)
						) {
							project.lastActivity = session.lastActivity;
						}
					}

					// Convert to array and sort by last activity
					const projects = Array.from(projectMap.values()).sort(
						(a, b) =>
							new Date(b.lastActivity).getTime() -
							new Date(a.lastActivity).getTime(),
					);

					// Apply pagination
					const total = projects.length;
					const paginatedProjects = projects.slice(
						validatedOffset,
						validatedOffset + validatedLimit,
					);
					const hasMore = validatedOffset + validatedLimit < total;

					return {
						projects: paginatedProjects,
						pagination: {
							total,
							limit: validatedLimit,
							offset: validatedOffset,
							hasMore,
						},
					};
				} catch (error) {
					console.error("Error getting projects:", error);
					set.status = 500;
					return {
						error: "INTERNAL_ERROR",
						message: "Failed to retrieve projects",
						timestamp: new Date().toISOString(),
					};
				}
			},
			{
				query: t.Object({
					limit: t.Optional(t.String()),
					offset: t.Optional(t.String()),
				}),
				detail: {
					summary: "List projects",
					description:
						"Get all projects with session metadata, sorted by last activity",
					tags: ["projects"],
					responses: {
						200: {
							description: "Projects retrieved successfully",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											projects: {
												type: "array",
												items: {
													type: "object",
													properties: {
														path: { type: "string" },
														encodedPath: { type: "string" },
														sessionCount: { type: "number" },
														lastActivity: { type: "string" },
														hasActiveSessions: { type: "boolean" },
														totalMessages: { type: "number" },
														hasToolUsage: { type: "boolean" },
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

		// GET /projects/:encodedPath/sessions - Get sessions for a specific project
		.get(
			"/:encodedPath/sessions",
			async ({ params, query, set }) => {
				try {
					const { encodedPath } = params;
					const { limit, offset, active } = query;

					// Decode the project path
					const projectPath = decodePath(encodedPath);

					// Validate pagination parameters
					const validatedLimit = Math.min(
						Math.max(Number(limit) || 50, 1),
						config.maxEntriesPerRequest,
					);
					const validatedOffset = Math.max(Number(offset) || 0, 0);

					// Get sessions for the specific project
					const projectSessions =
						await scanner.getSessionsByProject(projectPath);

					if (projectSessions.length === 0) {
						set.status = 404;
						return {
							error: "PROJECT_NOT_FOUND",
							message: `Project ${projectPath} not found or has no sessions`,
							timestamp: new Date().toISOString(),
						};
					}

					// Apply active filter if specified
					let filteredSessions = projectSessions;
					if (active === "true") {
						const activeSessions = await scanner.getAllSessions({
							active: true,
						});
						const activeIds = new Set(activeSessions.data.map((s) => s.id));
						filteredSessions = filteredSessions.filter((s) =>
							activeIds.has(s.id),
						);
					}

					// Sort by last activity (newest first)
					filteredSessions.sort(
						(a, b) =>
							new Date(b.lastActivity).getTime() -
							new Date(a.lastActivity).getTime(),
					);

					// Apply pagination
					const total = filteredSessions.length;
					const paginatedSessions = filteredSessions.slice(
						validatedOffset,
						validatedOffset + validatedLimit,
					);
					const hasMore = validatedOffset + validatedLimit < total;

					return {
						project: {
							path: projectPath,
							encodedPath,
						},
						sessions: paginatedSessions,
						pagination: {
							total,
							limit: validatedLimit,
							offset: validatedOffset,
							hasMore,
						},
					};
				} catch (error) {
					console.error(
						`Error getting sessions for project ${params.encodedPath}:`,
						error,
					);
					set.status = 500;
					return {
						error: "INTERNAL_ERROR",
						message: "Failed to retrieve project sessions",
						timestamp: new Date().toISOString(),
					};
				}
			},
			{
				params: t.Object({
					encodedPath: t.String(),
				}),
				query: t.Object({
					limit: t.Optional(t.String()),
					offset: t.Optional(t.String()),
					active: t.Optional(t.String()),
				}),
				detail: {
					summary: "Get project sessions",
					description:
						"Retrieve all sessions for a specific project using encoded path (dashes=slashes, double-dashes=dots)",
					tags: ["projects"],
					responses: {
						200: {
							description: "Project sessions retrieved successfully",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											project: {
												type: "object",
												properties: {
													path: { type: "string" },
													encodedPath: { type: "string" },
												},
											},
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
						404: {
							description: "Project not found",
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
