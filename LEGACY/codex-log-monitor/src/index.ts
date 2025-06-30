/**
 * @fileoverview Claude log monitor package for real-time and historical log file monitoring.
 *
 * This package provides comprehensive monitoring capabilities for Claude conversation logs
 * stored in the `~/.claude/projects/` directory structure. It supports both reading
 * historical data and real-time monitoring of new entries.
 *
 * @example
 * ```typescript
 * import { createMonitor } from '@dao/codex-log-monitor';
 *
 * const monitor = createMonitor();
 *
 * // Read historical data
 * for await (const entry of monitor.readAll()) {
 *   console.log(`${entry.project}: ${entry.line}`);
 * }
 *
 * // Monitor real-time changes
 * monitor.on('entry', entry => console.log('New:', entry.line));
 * await monitor.watch();
 * ```
 *
 * @packageDocumentation
 */

import { LogMonitor } from "./monitor.js";
import type {
	ActiveSession,
	LogMonitor as ILogMonitor,
	LogEntry,
	MonitorOptions,
} from "./types.js";

/**
 * Creates a new log monitor instance for watching Claude conversation logs.
 *
 * This is the main entry point for the package. The returned monitor can be used
 * to read historical log entries and watch for new ones in real-time.
 *
 * @param options - Optional configuration for the monitor
 * @returns A configured LogMonitor instance
 *
 * @example
 * ```typescript
 * // Default configuration
 * const monitor = createMonitor();
 *
 * // Custom configuration
 * const monitor = createMonitor({
 *   projectsPath: '/custom/claude/projects',
 *   activeThresholdMs: 300000 // 5 minutes
 * });
 * ```
 *
 * @public
 */
export function createMonitor(options?: MonitorOptions): ILogMonitor {
	return new LogMonitor(options);
}

/**
 * Core types for working with Claude log monitoring.
 *
 * @public
 */
export type { LogEntry, MonitorOptions, ActiveSession, ILogMonitor as LogMonitor };

/**
 * Utility functions for decoding Claude's project path encoding and extracting
 * session information from file paths.
 *
 * These functions can be used independently of the main monitor for path processing:
 *
 * @example
 * ```typescript
 * import { decodeProjectPath, extractSessionId, extractProject } from '@dao/codex-log-monitor';
 *
 * // Decode encoded directory names
 * const path = decodeProjectPath('-Users-john--config'); // "/Users/john/.config"
 *
 * // Extract session ID from filename
 * const sessionId = extractSessionId('abc123-def456.jsonl'); // "abc123-def456"
 *
 * // Extract project from full file path
 * const project = extractProject('/.claude/projects/-Users-john-app/session.jsonl');
 * // Returns: "/Users/john/app"
 * ```
 *
 * @public
 */
export { decodeProjectPath, extractProject, extractSessionId } from "./path-decoder.js";
