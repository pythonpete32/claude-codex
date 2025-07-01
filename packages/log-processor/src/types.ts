import type { LogEntry } from "@claude-codex/types";

/**
 * Raw log entry as it appears in Claude's JSONL files
 * This is different from the LogEntry type which is our domain model
 */
export interface RawLogEntry {
	uuid: string;
	parentUuid?: string | null;
	timestamp: string;
	type: "user" | "assistant";
	message?: {
		role: string;
		content: unknown;
	};
	content?: unknown; // Some entries might have content directly
	sessionId?: string;
	cwd?: string;
	[key: string]: unknown; // Allow other fields
}

/**
 * Options for configuring the LogMonitor
 */
export interface MonitorOptions {
	/** Custom path to Claude projects directory */
	projectsPath?: string;
	/** How long in ms before a session is considered inactive (default: 60000) */
	activeThresholdMs?: number;
	/** Poll interval for checking file changes in ms (default: 1000) */
	pollInterval?: number;
}

/**
 * Represents an active Claude session
 */
export interface ActiveSession {
	/** Session ID (UUID format) */
	sessionId: string;
	/** Decoded project path */
	project: string;
	/** Absolute path to the JSONL file */
	filePath: string;
	/** When the session was last modified */
	lastModified: Date;
	/** Whether the session is currently active */
	isActive: boolean;
}

/**
 * Events emitted by the LogMonitor
 */
export interface LogMonitorEvents {
	/** Emitted when a new log entry is detected */
	entry: (entry: LogEntry) => void;
	/** Emitted when a new session is discovered */
	"session:new": (session: ActiveSession) => void;
	/** Emitted when a session becomes active */
	"session:active": (session: ActiveSession) => void;
	/** Emitted when a session becomes inactive */
	"session:inactive": (session: ActiveSession) => void;
	/** Emitted when an error occurs */
	error: (error: Error) => void;
}

/**
 * Pending correlation between tool call and result
 */
export interface PendingCorrelation {
	entry: LogEntry;
	timestamp: number;
	attempts: number;
}

/**
 * Correlated tool call and result pair
 */
export interface CorrelatedPair {
	call: LogEntry;
	result: LogEntry;
}

/**
 * Events emitted by the CorrelationEngine
 */
export interface CorrelationEngineEvents {
	/** Emitted when a tool call is correlated with its result */
	"tool:completed": (data: {
		toolName: string;
		toolId: string;
		duration: number;
		call: LogEntry;
		result: LogEntry;
	}) => void;
	/** Emitted when a tool call times out */
	"tool:timeout": (data: {
		toolName: string;
		toolId: string;
		call: LogEntry;
	}) => void;
}

/**
 * Options for the CorrelationEngine
 */
export interface CorrelationEngineOptions {
	/** Timeout in ms before considering a tool call orphaned (default: 300000 - 5 minutes) */
	timeoutMs?: number;
	/** Cleanup interval in ms for checking timeouts (default: 60000 - 1 minute) */
	cleanupIntervalMs?: number;
}
