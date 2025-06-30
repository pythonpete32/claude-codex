import { EventEmitter } from "node:events";
import { createReadStream } from "node:fs";
import { readdir, stat, watch } from "node:fs/promises";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { createInterface } from "node:readline";
import { extractProject, extractSessionId } from "./path-decoder.js";
import type {
	ActiveSession,
	LogMonitor as ILogMonitor,
	LogEntry,
	MonitorOptions,
} from "./types.js";

/**
 * Internal session information for registry tracking.
 * @private
 */
interface SessionInfo {
	/** The session ID (UUID format) */
	sessionId: string;
	/** The decoded project path */
	project: string;
	/** Absolute path to the JSONL file */
	filePath: string;
	/** When the session file was last modified */
	lastModified: Date;
	/** When this session was first discovered */
	firstSeen: Date;
	/** File size for change detection */
	size: number;
}

/**
 * Log monitor implementation that watches Claude project log files.
 * Provides both historical data access and real-time monitoring.
 *
 * @public
 */
export class LogMonitor extends EventEmitter implements ILogMonitor {
	private projectsPath: string;
	private activeThresholdMs: number;
	// biome-ignore lint/suspicious/noExplicitAny: Watcher types vary between Node.js versions
	private watchers: Map<string, any> = new Map();
	private filePositions: Map<string, number> = new Map();
	private sessionRegistry: Map<string, SessionInfo> = new Map();
	private isWatching = false;
	private cleanupInterval: NodeJS.Timeout | null = null;

	/**
	 * Creates a new LogMonitor instance.
	 *
	 * @param options - Configuration options for the monitor
	 *
	 * @example
	 * ```typescript
	 * const monitor = new LogMonitor({
	 *   projectsPath: '/custom/path',
	 *   activeThresholdMs: 300000 // 5 minutes
	 * });
	 * ```
	 */
	constructor(options: MonitorOptions = {}) {
		super();
		const defaultPath = join(homedir(), ".claude", "projects");
		this.projectsPath = options.projectsPath ? resolve(options.projectsPath) : defaultPath;
		this.activeThresholdMs = options.activeThresholdMs ?? 60000;
	}

	/**
	 * Read all existing log entries from all JSONL files.
	 * Discovers project directories, finds JSONL files, and yields entries.
	 *
	 * @yields LogEntry objects for each line in all discovered files
	 *
	 * @example
	 * ```typescript
	 * for await (const entry of monitor.readAll()) {
	 *   console.log(`[${entry.sessionId}] ${entry.line}`);
	 * }
	 * ```
	 */
	async *readAll(): AsyncGenerator<LogEntry> {
		const projectDirs = await this.getProjectDirectories();

		for (const projectDir of projectDirs) {
			const files = await this.getJsonlFiles(projectDir);

			for (const filePath of files) {
				yield* this.readFile(filePath);
			}
		}
	}

	/**
	 * Start watching for new log entries in real-time.
	 * Sets up file system watchers for existing directories and files,
	 * and monitors for new directories and files being created.
	 *
	 * @throws {Error} If already watching (silently returns instead)
	 *
	 * @example
	 * ```typescript
	 * monitor.on('entry', (entry) => console.log('New:', entry.line));
	 * await monitor.watch();
	 * ```
	 */
	async watch(): Promise<void> {
		if (this.isWatching) return;
		this.isWatching = true;

		const projectDirs = await this.getProjectDirectories();

		for (const projectDir of projectDirs) {
			await this.watchDirectory(projectDir);
		}

		const watcher = await watch(this.projectsPath);
		this.watchers.set(this.projectsPath, watcher);

		(async () => {
			for await (const event of watcher) {
				if (event.filename && !this.watchers.has(join(this.projectsPath, event.filename))) {
					const fullPath = join(this.projectsPath, event.filename);
					const stats = await stat(fullPath).catch(() => null);
					if (stats?.isDirectory()) {
						await this.watchDirectory(fullPath);
					}
				}
			}
		})();

		// Set up periodic cleanup of old sessions (every hour)
		this.cleanupInterval = setInterval(
			() => {
				this.cleanupOldSessions();
			},
			60 * 60 * 1000,
		); // 1 hour
	}

	/**
	 * Get all sessions that have been modified within the active threshold.
	 * Returns sessions sorted by most recent modification time first.
	 *
	 * @returns Array of active sessions sorted by recency
	 *
	 * @example
	 * ```typescript
	 * const monitor = createMonitor({ activeThresholdMs: 300000 }); // 5 minutes
	 *
	 * // Get sessions modified in the last 5 minutes
	 * const activeSessions = monitor.getActiveSessions();
	 * console.log(`Found ${activeSessions.length} active sessions`);
	 *
	 * for (const session of activeSessions) {
	 *   console.log(`${session.project} - Last active: ${session.lastModified}`);
	 * }
	 * ```
	 */
	getActiveSessions(): ActiveSession[] {
		const now = Date.now();

		return Array.from(this.sessionRegistry.values())
			.filter((session) => {
				const age = now - session.lastModified.getTime();
				return age <= this.activeThresholdMs;
			})
			.map((session) => ({
				sessionId: session.sessionId,
				project: session.project,
				lastModified: session.lastModified,
			}))
			.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
	}

	/**
	 * Stop watching files and clean up all resources.
	 * Closes all file watchers and clears internal state.
	 * Safe to call multiple times.
	 *
	 * @example
	 * ```typescript
	 * // Always clean up when done
	 * process.on('exit', () => monitor.stop());
	 * ```
	 */
	stop(): void {
		this.isWatching = false;

		// Close all file watchers
		for (const watcher of this.watchers.values()) {
			if (watcher && typeof watcher.close === "function") {
				watcher.close();
			}
		}

		// Clear cleanup interval
		if (this.cleanupInterval) {
			clearInterval(this.cleanupInterval);
			this.cleanupInterval = null;
		}

		// Clear all internal state
		this.watchers.clear();
		this.filePositions.clear();
		this.sessionRegistry.clear();
	}

	/**
	 * Discover all project directories in the projects path.
	 *
	 * @returns Array of absolute paths to project directories
	 * @private
	 */
	private async getProjectDirectories(): Promise<string[]> {
		try {
			const entries = await readdir(this.projectsPath, { withFileTypes: true });
			return entries
				.filter((entry) => entry.isDirectory())
				.map((entry) => join(this.projectsPath, entry.name));
		} catch (error) {
			if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
				return [];
			}
			throw error;
		}
	}

	/**
	 * Find all JSONL files in a project directory.
	 *
	 * @param directory - Absolute path to the project directory
	 * @returns Array of absolute paths to JSONL files
	 * @private
	 */
	private async getJsonlFiles(directory: string): Promise<string[]> {
		try {
			const entries = await readdir(directory, { withFileTypes: true });
			return entries
				.filter((entry) => entry.isFile() && entry.name.endsWith(".jsonl"))
				.map((entry) => join(directory, entry.name));
		} catch {
			return [];
		}
	}

	/**
	 * Read all lines from a single JSONL file.
	 *
	 * @param filePath - Absolute path to the JSONL file
	 * @yields LogEntry objects for each non-empty line
	 * @private
	 */
	private async *readFile(filePath: string): AsyncGenerator<LogEntry> {
		// Get file stats and update registry during discovery
		try {
			const fileStats = await stat(filePath);
			await this.updateSessionRegistry(filePath, {
				mtime: fileStats.mtime,
				size: fileStats.size,
			});
		} catch (error) {
			// File might have been deleted, skip registry update
			console.debug(`Failed to get stats for ${filePath}:`, error);
		}

		const fileStream = createReadStream(filePath, { encoding: "utf8" });
		const rl = createInterface({
			input: fileStream,
			crlfDelay: Infinity,
		});

		let lineNumber = 0;
		const sessionId = extractSessionId(filePath);
		const project = extractProject(filePath);

		for await (const line of rl) {
			lineNumber++;
			if (line.trim()) {
				yield {
					line,
					project,
					sessionId,
					filePath,
					lineNumber,
				};
			}
		}

		this.filePositions.set(filePath, lineNumber);
	}

	private async watchDirectory(directory: string): Promise<void> {
		const files = await this.getJsonlFiles(directory);

		for (const filePath of files) {
			await this.watchFile(filePath);
		}

		const watcher = await watch(directory);
		this.watchers.set(directory, watcher);

		(async () => {
			for await (const event of watcher) {
				if (event.filename?.endsWith(".jsonl")) {
					const fullPath = join(directory, event.filename);

					// Check if file exists (creation) or was deleted
					try {
						const fileStats = await stat(fullPath);
						// File exists, add to registry and start watching
						await this.updateSessionRegistry(fullPath, {
							mtime: fileStats.mtime,
							size: fileStats.size,
						});
						await this.watchFile(fullPath);
					} catch (_error) {
						// File was deleted, remove from registry
						const sessionId = extractSessionId(fullPath);
						this.removeSessionFromRegistry(sessionId);
					}
				}
			}
		})();
	}

	private async watchFile(filePath: string): Promise<void> {
		if (this.watchers.has(filePath)) return;

		const startPosition = this.filePositions.get(filePath) || 0;
		let currentPosition = startPosition;

		const watcher = await watch(filePath);
		this.watchers.set(filePath, watcher);

		(async () => {
			for await (const event of watcher) {
				if (event.eventType === "change") {
					// Update registry with latest file stats
					try {
						const fileStats = await stat(filePath);
						await this.updateSessionRegistry(filePath, {
							mtime: fileStats.mtime,
							size: fileStats.size,
						});
					} catch (_error) {
						// File might have been deleted, remove from registry
						const sessionId = extractSessionId(filePath);
						this.removeSessionFromRegistry(sessionId);
						continue;
					}

					const newLines = await this.readNewLines(filePath, currentPosition);
					for (const entry of newLines) {
						this.emit("entry", entry);
						currentPosition = entry.lineNumber;
					}
					this.filePositions.set(filePath, currentPosition);
				}
			}
		})();
	}

	private async readNewLines(filePath: string, fromLine: number): Promise<LogEntry[]> {
		const entries: LogEntry[] = [];
		const fileStream = createReadStream(filePath, { encoding: "utf8" });
		const rl = createInterface({
			input: fileStream,
			crlfDelay: Infinity,
		});

		let lineNumber = 0;
		const sessionId = extractSessionId(filePath);
		const project = extractProject(filePath);

		for await (const line of rl) {
			lineNumber++;
			if (lineNumber > fromLine && line.trim()) {
				entries.push({
					line,
					project,
					sessionId,
					filePath,
					lineNumber,
				});
			}
		}

		return entries;
	}

	/**
	 * Update the session registry with file information.
	 *
	 * @param filePath - Absolute path to the JSONL file
	 * @param stats - File stats containing modification time and size
	 * @private
	 */
	private async updateSessionRegistry(
		filePath: string,
		stats: { mtime: Date; size: number },
	): Promise<void> {
		const sessionId = extractSessionId(filePath);
		const project = extractProject(filePath);
		const now = new Date();

		const existing = this.sessionRegistry.get(sessionId);

		this.sessionRegistry.set(sessionId, {
			sessionId,
			project,
			filePath,
			lastModified: stats.mtime,
			firstSeen: existing?.firstSeen || now,
			size: stats.size,
		});
	}

	/**
	 * Remove a session from the registry (when file is deleted).
	 *
	 * @param sessionId - The session ID to remove
	 * @private
	 */
	private removeSessionFromRegistry(sessionId: string): void {
		this.sessionRegistry.delete(sessionId);
	}

	/**
	 * Clean up old sessions that haven't been modified for more than 24 hours.
	 *
	 * @private
	 */
	private cleanupOldSessions(): void {
		const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;

		for (const [sessionId, session] of this.sessionRegistry.entries()) {
			if (session.lastModified.getTime() < twentyFourHoursAgo) {
				this.sessionRegistry.delete(sessionId);
			}
		}
	}
}
