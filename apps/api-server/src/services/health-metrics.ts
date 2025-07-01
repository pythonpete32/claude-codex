/**
 * @fileoverview Health metrics service for system monitoring
 * @module @dao/codex-api-server/services/health-metrics
 */

import { stat } from "node:fs/promises";
import { config } from "../config";
import { SessionScanner } from "./session-scanner";

/**
 * System health metrics
 */
export interface HealthMetrics {
	status: "healthy" | "degraded" | "unhealthy";
	timestamp: string;
	version: string;
	uptime: number;
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
	services: {
		fileSystem: {
			status: "healthy" | "unhealthy";
			logsPath: string;
			accessible: boolean;
		};
		sessionScanner: {
			status: "healthy" | "unhealthy";
			activeSessions: number;
			totalSessions: number;
		};
	};
	performance: {
		averageResponseTime: number;
		requestCount: number;
		errorRate: number;
	};
}

/**
 * Performance tracking for health metrics
 */
class PerformanceTracker {
	private responseTimes: number[] = [];
	private requestCount = 0;
	private errorCount = 0;
	private readonly maxSamples = 100;

	addResponse(responseTime: number, isError = false): void {
		this.responseTimes.push(responseTime);
		this.requestCount++;

		if (isError) {
			this.errorCount++;
		}

		// Keep only recent samples
		if (this.responseTimes.length > this.maxSamples) {
			this.responseTimes.shift();
		}
	}

	getMetrics(): { averageResponseTime: number; requestCount: number; errorRate: number } {
		const averageResponseTime =
			this.responseTimes.length > 0
				? this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length
				: 0;

		const errorRate = this.requestCount > 0 ? (this.errorCount / this.requestCount) * 100 : 0;

		return {
			averageResponseTime: Math.round(averageResponseTime * 100) / 100,
			requestCount: this.requestCount,
			errorRate: Math.round(errorRate * 100) / 100,
		};
	}

	reset(): void {
		this.responseTimes = [];
		this.requestCount = 0;
		this.errorCount = 0;
	}
}

// Global performance tracker instance
const performanceTracker = new PerformanceTracker();

/**
 * Health metrics service
 */
export class HealthMetricsService {
	private scanner: SessionScanner;

	constructor() {
		this.scanner = new SessionScanner({
			logsPath: config.claudeLogsPath,
			activeThreshold: config.activeSessionThreshold,
		});
	}

	/**
	 * Get comprehensive health metrics
	 */
	async getHealthMetrics(): Promise<HealthMetrics> {
		const startTime = Date.now();

		try {
			// Gather all metrics in parallel
			const [systemMetrics, fileSystemHealth, sessionMetrics, performanceMetrics] =
				await Promise.all([
					this.getSystemMetrics(),
					this.checkFileSystemHealth(),
					this.getSessionMetrics(),
					this.getPerformanceMetrics(),
				]);

			// Determine overall health status
			const status = this.determineHealthStatus(fileSystemHealth, sessionMetrics);

			const metrics: HealthMetrics = {
				status,
				timestamp: new Date().toISOString(),
				version: "0.1.0",
				uptime: process.uptime(),
				system: systemMetrics,
				services: {
					fileSystem: fileSystemHealth,
					sessionScanner: sessionMetrics,
				},
				performance: performanceMetrics,
			};

			// Track this health check performance
			const responseTime = Date.now() - startTime;
			performanceTracker.addResponse(responseTime);

			return metrics;
		} catch (error) {
			console.error("Error gathering health metrics:", error);

			// Track error
			const responseTime = Date.now() - startTime;
			performanceTracker.addResponse(responseTime, true);

			// Return degraded health status
			return {
				status: "unhealthy",
				timestamp: new Date().toISOString(),
				version: "0.1.0",
				uptime: process.uptime(),
				system: {
					memory: { used: 0, total: 0, percentage: 0 },
					cpu: { usage: 0 },
				},
				services: {
					fileSystem: {
						status: "unhealthy",
						logsPath: config.claudeLogsPath,
						accessible: false,
					},
					sessionScanner: {
						status: "unhealthy",
						activeSessions: 0,
						totalSessions: 0,
					},
				},
				performance: performanceTracker.getMetrics(),
			};
		}
	}

	/**
	 * Get system resource metrics
	 */
	private async getSystemMetrics(): Promise<HealthMetrics["system"]> {
		const memUsage = process.memoryUsage();
		const totalMemory = memUsage.heapTotal + memUsage.external;
		const usedMemory = memUsage.heapUsed;

		// Simple CPU usage approximation (not perfect but reasonable for health checks)
		const cpuUsage = process.cpuUsage();
		const cpuPercent = ((cpuUsage.user + cpuUsage.system) / 1000000) / process.uptime();

		return {
			memory: {
				used: usedMemory,
				total: totalMemory,
				percentage: Math.round((usedMemory / totalMemory) * 100),
			},
			cpu: {
				usage: Math.min(Math.round(cpuPercent * 100) / 100, 100),
			},
		};
	}

	/**
	 * Check file system health
	 */
	private async checkFileSystemHealth(): Promise<HealthMetrics["services"]["fileSystem"]> {
		try {
			const logsPath = config.claudeLogsPath.replace("~", process.env.HOME || "");
			await stat(logsPath);

			return {
				status: "healthy",
				logsPath: config.claudeLogsPath,
				accessible: true,
			};
		} catch (error) {
			console.warn("File system health check failed:", error);
			return {
				status: "unhealthy",
				logsPath: config.claudeLogsPath,
				accessible: false,
			};
		}
	}

	/**
	 * Get session scanner metrics
	 */
	private async getSessionMetrics(): Promise<HealthMetrics["services"]["sessionScanner"]> {
		try {
			const allSessions = await this.scanner.getAllSessions({
				limit: Number.MAX_SAFE_INTEGER,
				offset: 0,
			});

			const activeSessions = await this.scanner.getAllSessions({
				limit: Number.MAX_SAFE_INTEGER,
				offset: 0,
				active: true,
			});

			return {
				status: "healthy",
				activeSessions: activeSessions.total,
				totalSessions: allSessions.total,
			};
		} catch (error) {
			console.warn("Session scanner health check failed:", error);
			return {
				status: "unhealthy",
				activeSessions: 0,
				totalSessions: 0,
			};
		}
	}

	/**
	 * Get performance metrics
	 */
	private async getPerformanceMetrics(): Promise<HealthMetrics["performance"]> {
		return performanceTracker.getMetrics();
	}

	/**
	 * Determine overall health status
	 */
	private determineHealthStatus(
		fileSystemHealth: HealthMetrics["services"]["fileSystem"],
		sessionMetrics: HealthMetrics["services"]["sessionScanner"],
	): "healthy" | "degraded" | "unhealthy" {
		if (fileSystemHealth.status === "unhealthy") {
			return "unhealthy";
		}

		if (sessionMetrics.status === "unhealthy") {
			return "degraded";
		}

		return "healthy";
	}

	/**
	 * Add request performance tracking
	 */
	static trackRequest(responseTime: number, isError = false): void {
		performanceTracker.addResponse(responseTime, isError);
	}

	/**
	 * Reset performance metrics
	 */
	static resetMetrics(): void {
		performanceTracker.reset();
	}

	/**
	 * Clean up resources
	 */
	destroy(): void {
		this.scanner.destroy();
	}
}