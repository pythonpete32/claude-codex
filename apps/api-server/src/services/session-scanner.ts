/**
 * @fileoverview Session file system scanning service
 * @module @dao/codex-api-server/services/session-scanner
 */

import { stat } from "node:fs/promises";
// import type { ActiveSession, LogEntry } from "@dao/codex-log-monitor";
// import { createMonitor } from "@dao/codex-log-monitor";
import type { PaginatedResponse, SessionInfo } from "../types/api";

/**
 * Options for session scanning
 */
interface ScanOptions {
  /** Base path to Claude logs directory */
  logsPath: string;
  /** Active session threshold in milliseconds */
  activeThreshold: number;
}

/**
 * Service for scanning and managing Claude session files
 */
export class SessionScanner {
  private monitor: ReturnType<typeof createMonitor>;

  constructor(options: ScanOptions) {
    this.monitor = createMonitor({
      projectsPath: options.logsPath,
      activeThresholdMs: options.activeThreshold,
    });
  }

  /**
   * Get all sessions with pagination and filtering
   */
  async getAllSessions(options: {
    limit?: number;
    offset?: number;
    active?: boolean;
    project?: string;
  }): Promise<PaginatedResponse<SessionInfo>> {
    const { limit = 50, offset = 0, active, project } = options;

    // Get all sessions from file system
    const allSessions = await this.scanAllSessions();

    // Apply filters
    let filteredSessions = allSessions;

    if (active) {
      const activeSessions = this.monitor.getActiveSessions();
      const activeIds = new Set(activeSessions.map((s) => s.sessionId));
      filteredSessions = filteredSessions.filter((s) => activeIds.has(s.id));
    }

    if (project) {
      filteredSessions = filteredSessions.filter((s) =>
        s.projectPath.includes(project)
      );
    }

    // Sort by last activity (newest first)
    filteredSessions.sort(
      (a, b) =>
        new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
    );

    // Apply pagination
    const total = filteredSessions.length;
    const paginatedData = filteredSessions.slice(offset, offset + limit);
    const hasMore = offset + limit < total;

    return {
      data: paginatedData,
      total,
      limit,
      offset,
      hasMore,
    };
  }

  /**
   * Get session details by ID
   */
  async getSessionById(sessionId: string): Promise<SessionInfo | null> {
    const allSessions = await this.scanAllSessions();
    return allSessions.find((s) => s.id === sessionId) || null;
  }

  /**
   * Get sessions for a specific project
   */
  async getSessionsByProject(projectPath: string): Promise<SessionInfo[]> {
    const allSessions = await this.scanAllSessions();
    return allSessions.filter((s) => s.projectPath === projectPath);
  }

  /**
   * Get file path for a specific session
   */
  async getSessionFilePath(sessionId: string): Promise<string | null> {
    try {
      // Use the monitor's readAll to find the session
      for await (const entry of this.monitor.readAll()) {
        if (entry.sessionId === sessionId) {
          return entry.filePath;
        }
      }
      return null;
    } catch (error) {
      console.error(`Error getting file path for session ${sessionId}:`, error);
      return null;
    }
  }

  /**
   * Scan all session files from the file system
   */
  private async scanAllSessions(): Promise<SessionInfo[]> {
    try {
      const sessions: SessionInfo[] = [];
      const activeSessions = this.monitor.getActiveSessions();
      const activeMap = new Map(activeSessions.map((s) => [s.sessionId, s]));

      // Use the monitor's readAll to get all entries
      for await (const entry of this.monitor.readAll()) {
        // Check if we've already processed this session
        if (sessions.some((s) => s.id === entry.sessionId)) {
          continue;
        }

        // Get session info from the entry
        const sessionInfo = await this.createSessionInfo(entry, activeMap);
        if (sessionInfo) {
          sessions.push(sessionInfo);
        }
      }

      return sessions;
    } catch (error) {
      console.error("Error scanning sessions:", error);
      return [];
    }
  }

  /**
   * Create SessionInfo from a log entry
   */
  private async createSessionInfo(
    entry: LogEntry,
    activeMap: Map<string, ActiveSession>
  ): Promise<SessionInfo | null> {
    try {
      // Get file stats for additional metadata
      const stats = await stat(entry.filePath);

      // Count total lines in the file (approximate message count)
      const messageCount = await this.countFileLines(entry.filePath);

      // Parse first entry to get creation time
      const createdAt = await this.getSessionCreatedTime(entry.filePath);

      // Check if session contains tool usage
      const hasToolUsage = await this.checkForToolUsage(entry.filePath);

      // Check if session is active
      const activeSession = activeMap.get(entry.sessionId);
      const isActive = !!activeSession;

      return {
        id: entry.sessionId,
        projectPath: entry.project,
        lastActivity: stats.mtime.toISOString(),
        messageCount,
        hasToolUsage,
        isActive,
        createdAt: createdAt || stats.birthtime.toISOString(),
        fileSize: stats.size,
      };
    } catch (error) {
      console.error(
        `Error creating session info for ${entry.sessionId}:`,
        error
      );
      return null;
    }
  }

  /**
   * Count lines in a JSONL file
   */
  private async countFileLines(filePath: string): Promise<number> {
    try {
      const { readFile } = await import("node:fs/promises");
      const content = await readFile(filePath, "utf-8");
      return content.split("\n").filter((line) => line.trim()).length;
    } catch {
      return 0;
    }
  }

  /**
   * Get session creation time from first entry
   */
  private async getSessionCreatedTime(
    filePath: string
  ): Promise<string | null> {
    try {
      const { readFile } = await import("node:fs/promises");
      const content = await readFile(filePath, "utf-8");
      const lines = content.split("\n").filter((line) => line.trim());

      if (lines.length === 0) return null;

      const firstEntry = JSON.parse(lines[0]);
      return firstEntry.timestamp || null;
    } catch {
      return null;
    }
  }

  /**
   * Check if session contains tool usage
   */
  private async checkForToolUsage(filePath: string): Promise<boolean> {
    try {
      const { readFile } = await import("node:fs/promises");
      const content = await readFile(filePath, "utf-8");

      // Simple check for tool_use content
      return (
        content.includes('"type":"tool_use"') ||
        content.includes('"tool_use_id"')
      );
    } catch {
      return false;
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.monitor.stop();
  }
}
