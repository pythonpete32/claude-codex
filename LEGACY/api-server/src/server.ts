/**
 * @fileoverview Main API server using Elysia framework
 * @module @dao/codex-api-server/server
 */

import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";
import { config } from "./config";
import { createProjectRoutes } from "./routes/projects";
import { createSessionRoutes } from "./routes/sessions";
import { HealthMetricsService } from "./services/health-metrics";

/**
 * Create and configure the main API server
 */
function createServer() {
	const app = new Elysia({
		prefix: "/api",
	})
		// Enable CORS
		.use(
			cors({
				origin: config.corsOrigins,
				methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
				allowedHeaders: ["Content-Type", "Authorization"],
			}),
		)

		// Performance tracking middleware
		.derive(() => {
			const startTime = Date.now();
			return {
				startTime,
			};
		})
		.onAfterHandle(({ startTime, set }) => {
			const responseTime = Date.now() - startTime;
			const status = set.status ? Number(set.status) : 200;
			const isError = status >= 400;
			HealthMetricsService.trackRequest(responseTime, isError);
		})

		// Enable API documentation
		.use(
			swagger({
				documentation: {
					info: {
						title: "Claude Conversation Log API",
						version: "1.0.0",
						description: "REST API and WebSocket server for Claude conversation logs",
					},
					tags: [
						{ name: "sessions", description: "Session management endpoints" },
						{ name: "projects", description: "Project-based queries" },
						{ name: "health", description: "Health and monitoring" },
						{ name: "stream", description: "Real-time WebSocket streaming" },
					],
				},
			}),
		)

		// Enhanced health check endpoint
		.get(
			"/health",
			async ({ set }) => {
				const startTime = Date.now();
				try {
					const healthService = new HealthMetricsService();
					const metrics = await healthService.getHealthMetrics();
					healthService.destroy();

					// Set appropriate HTTP status based on health
					switch (metrics.status) {
						case "healthy":
							set.status = 200;
							break;
						case "degraded":
							set.status = 200; // Still operational
							break;
						case "unhealthy":
							set.status = 503; // Service unavailable
							break;
					}

					// Track performance
					const responseTime = Date.now() - startTime;
					HealthMetricsService.trackRequest(responseTime);

					return metrics;
				} catch (error) {
					const responseTime = Date.now() - startTime;
					HealthMetricsService.trackRequest(responseTime, true);
					
					console.error("Health check failed:", error);
					set.status = 503;
					return {
						status: "unhealthy",
						timestamp: new Date().toISOString(),
						version: "0.1.0",
						error: "Health check failed",
					};
				}
			},
			{
				detail: {
					summary: "Enhanced health check",
					description: "Comprehensive health metrics including system resources, services, and performance data",
					tags: ["health"],
					responses: {
						200: {
							description: "System is healthy or degraded but operational",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											status: { type: "string", enum: ["healthy", "degraded", "unhealthy"] },
											timestamp: { type: "string" },
											version: { type: "string" },
											uptime: { type: "number" },
											system: {
												type: "object",
												properties: {
													memory: {
														type: "object",
														properties: {
															used: { type: "number" },
															total: { type: "number" },
															percentage: { type: "number" },
														},
													},
													cpu: {
														type: "object",
														properties: {
															usage: { type: "number" },
														},
													},
												},
											},
											services: {
												type: "object",
												properties: {
													fileSystem: {
														type: "object",
														properties: {
															status: { type: "string" },
															logsPath: { type: "string" },
															accessible: { type: "boolean" },
														},
													},
													sessionScanner: {
														type: "object",
														properties: {
															status: { type: "string" },
															activeSessions: { type: "number" },
															totalSessions: { type: "number" },
														},
													},
												},
											},
											performance: {
												type: "object",
												properties: {
													averageResponseTime: { type: "number" },
													requestCount: { type: "number" },
													errorRate: { type: "number" },
												},
											},
										},
									},
								},
							},
						},
						503: {
							description: "System is unhealthy",
						},
					},
				},
			},
		)

		// Session routes
		.use(createSessionRoutes())

		// Project routes
		.use(createProjectRoutes())

		// Root endpoint
		.get("/", () => ({
			message: "Claude Conversation Log API",
			version: "0.1.0",
			endpoints: {
				health: "/api/health",
				docs: "/api/swagger",
				sessions: "/api/sessions",
				projects: "/api/projects",
				stream: "/api/stream",
			},
		}))

		// Error handling
		.onError(({ code, error, set }) => {
			const errorMessage = error instanceof Error ? error.message : String(error);
			console.error(`[API Error] ${code}:`, errorMessage);

			switch (code) {
				case "VALIDATION":
					set.status = 400;
					return {
						error: "VALIDATION_ERROR",
						message: "Invalid request data",
						details: errorMessage,
						timestamp: new Date().toISOString(),
					};

				case "NOT_FOUND":
					set.status = 404;
					return {
						error: "NOT_FOUND",
						message: "Resource not found",
						timestamp: new Date().toISOString(),
					};

				default:
					set.status = 500;
					return {
						error: "INTERNAL_ERROR",
						message: "Internal server error",
						timestamp: new Date().toISOString(),
					};
			}
		});

	return app;
}

/**
 * Start the server
 */
async function startServer() {
	try {
		const app = createServer();

		// Start listening
		app.listen({
			hostname: config.hostname,
			port: config.port,
		});

		console.log(
			`🚀 Claude Conversation Log API server running at http://${config.hostname}:${config.port}`,
		);
		console.log(
			`📚 API documentation available at http://${config.hostname}:${config.port}/api/swagger`,
		);
		console.log(`💡 Health check: http://${config.hostname}:${config.port}/api/health`);

		// Graceful shutdown
		const shutdown = () => {
			console.log("\n🛑 Shutting down server...");
			app.stop();
			process.exit(0);
		};

		process.on("SIGINT", shutdown);
		process.on("SIGTERM", shutdown);

		return app;
	} catch (error) {
		console.error("❌ Failed to start server:", error);
		process.exit(1);
	}
}

// Start server if this file is run directly
if (import.meta.main) {
	startServer();
}

export { createServer, startServer };
