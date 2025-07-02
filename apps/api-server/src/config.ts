/**
 * @fileoverview Server configuration management
 * @module @dao/codex-api-server/config
 */

import { homedir } from "node:os";
import { join } from "node:path";

/**
 * Server configuration derived from environment variables with sensible defaults
 */
export interface ServerConfig {
	/** Server port number */
	port: number;
	/** Server hostname */
	hostname: string;
	/** Allowed CORS origins */
	corsOrigins: string[];
	/** Claude logs directory path */
	claudeLogsPath: string;
	/** Active session threshold in milliseconds */
	activeSessionThreshold: number;
	/** Maximum entries per API request */
	maxEntriesPerRequest: number;
	/** Cache TTL in milliseconds */
	cacheTTL: number;
	/** WebSocket heartbeat interval in milliseconds */
	wsHeartbeatInterval: number;
	/** Maximum WebSocket connections */
	maxWsConnections: number;
}

/**
 * Load and validate server configuration from environment variables
 */
export function loadConfig(): ServerConfig {
	return {
		port: Number(process.env.PORT) || 3001,
		hostname: process.env.HOST || "localhost",
		corsOrigins: process.env.CORS_ORIGINS?.split(",") || ["*"],
		claudeLogsPath:
			process.env.CLAUDE_LOGS_PATH || join(homedir(), ".claude", "projects"),
		activeSessionThreshold:
			Number(process.env.ACTIVE_SESSION_THRESHOLD) || 60000,
		maxEntriesPerRequest: Number(process.env.MAX_ENTRIES_PER_REQUEST) || 1000,
		cacheTTL: Number(process.env.CACHE_TTL) || 300000,
		wsHeartbeatInterval: Number(process.env.WS_HEARTBEAT_INTERVAL) || 30000,
		maxWsConnections: Number(process.env.MAX_WS_CONNECTIONS) || 100,
	};
}

/**
 * Validate configuration values
 */
export function validateConfig(config: ServerConfig): void {
	if (config.port < 1 || config.port > 65535) {
		throw new Error(`Invalid port: ${config.port}. Must be between 1-65535`);
	}

	if (config.activeSessionThreshold < 0) {
		throw new Error(
			`Invalid activeSessionThreshold: ${config.activeSessionThreshold}. Must be >= 0`,
		);
	}

	if (config.maxEntriesPerRequest < 1) {
		throw new Error(
			`Invalid maxEntriesPerRequest: ${config.maxEntriesPerRequest}. Must be >= 1`,
		);
	}
}

/**
 * Default configuration instance
 */
export const config = loadConfig();

// Validate on load
validateConfig(config);
