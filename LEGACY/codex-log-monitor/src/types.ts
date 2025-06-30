/**
 * Represents a single log entry from a Claude session JSONL file.
 *
 * @public
 */
export interface LogEntry {
	/** The raw JSONL line content as stored in the file */
	line: string;
	/** The decoded project path (e.g., "/Users/john/project-a") */
	project: string;
	/** The session ID extracted from the filename (UUID format) */
	sessionId: string;
	/** The absolute path to the JSONL file containing this entry */
	filePath: string;
	/** The line number within the file (1-indexed) */
	lineNumber: number;
}

/**
 * Configuration options for creating a log monitor instance.
 *
 * @public
 */
export interface MonitorOptions {
	/**
	 * Base path to the projects directory.
	 * @defaultValue `~/.claude/projects/`
	 */
	projectsPath?: string;
	/**
	 * Threshold in milliseconds for considering a session "active".
	 * Sessions modified within this timeframe are returned by getActiveSessions().
	 * @defaultValue 60000 (1 minute)
	 */
	activeThresholdMs?: number;
}

/**
 * Represents an active Claude session with recent activity.
 *
 * @public
 */
export interface ActiveSession {
	/** The session ID (UUID format) */
	sessionId: string;
	/** The decoded project path */
	project: string;
	/** When the session file was last modified */
	lastModified: Date;
}

/**
 * Main interface for the log monitor service.
 * Provides both historical data access and real-time monitoring capabilities.
 *
 * @public
 */
export interface LogMonitor {
	/**
	 * Read all existing log entries from all JSONL files.
	 * Returns an async generator that yields entries in file discovery order.
	 *
	 * @returns An async generator yielding LogEntry objects
	 *
	 * @example
	 * ```typescript
	 * for await (const entry of monitor.readAll()) {
	 *   console.log(`${entry.project}: ${entry.line}`);
	 * }
	 * ```
	 */
	readAll(): AsyncGenerator<LogEntry>;

	/**
	 * Start watching for new log entries in real-time.
	 * Emits 'entry' events for each new line detected.
	 *
	 * @throws Will throw if already watching
	 */
	watch(): void;

	/**
	 * Register an event handler for new log entries.
	 * Only emits events when watch() is active.
	 *
	 * @param event - The event type (currently only 'entry' is supported)
	 * @param handler - Function to call when a new entry is detected
	 *
	 * @example
	 * ```typescript
	 * monitor.on('entry', (entry) => {
	 *   console.log('New entry:', entry.line);
	 * });
	 * ```
	 */
	on(event: "entry", handler: (entry: LogEntry) => void): void;

	/**
	 * Get all sessions that have been modified within the active threshold.
	 *
	 * @returns Array of active sessions sorted by last modified time
	 */
	getActiveSessions(): ActiveSession[];

	/**
	 * Stop watching files and clean up all resources.
	 * Safe to call multiple times.
	 */
	stop(): void;
}
