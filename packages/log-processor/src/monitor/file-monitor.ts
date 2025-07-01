import { EventEmitter } from 'node:events';
import { createReadStream } from 'node:fs';
import { readdir, stat } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { createInterface } from 'node:readline';
import type { LogEntry, MessageContent } from '@claude-codex/types';
import { createChildLogger } from '@claude-codex/utils';
import * as chokidar from 'chokidar';
import type {
  ActiveSession,
  LogMonitorEvents,
  MonitorOptions,
  RawLogEntry,
} from '../types.js';

// Create logger for this module
const logger = createChildLogger('file-monitor');

/**
 * Internal session information for registry tracking.
 */
interface SessionInfo {
  sessionId: string;
  project: string;
  filePath: string;
  lastModified: Date;
  firstSeen: Date;
  size: number;
}

/**
 * Log monitor that watches Claude project log files.
 * Provides both historical data access and real-time monitoring.
 */
export class FileMonitor extends EventEmitter {
  private projectsPath: string;
  private activeThresholdMs: number;
  private watcher: chokidar.FSWatcher | null = null;
  private filePositions: Map<string, number> = new Map();
  private sessionRegistry: Map<string, SessionInfo> = new Map();
  private isWatching = false;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(options: MonitorOptions = {}) {
    super();
    const defaultPath = join(homedir(), '.claude', 'projects');
    this.projectsPath = options.projectsPath
      ? resolve(options.projectsPath)
      : defaultPath;
    this.activeThresholdMs = options.activeThresholdMs ?? 60000;

    logger.info({ projectsPath: this.projectsPath }, 'FileMonitor initialized');
  }

  /**
   * Read all existing log entries from all JSONL files.
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
   */
  async startWatching(): Promise<void> {
    if (this.isWatching) {
      logger.warn('FileMonitor is already watching');
      return;
    }

    this.isWatching = true;
    logger.info('Starting file monitoring');

    // Initial scan
    await this.scanExistingSessions();

    // Watch for new and changed files
    this.watcher = chokidar.watch(`${this.projectsPath}/**/*.jsonl`, {
      persistent: true,
      ignoreInitial: false,
      awaitWriteFinish: {
        stabilityThreshold: 200,
        pollInterval: 100,
      },
    });

    this.watcher
      .on('add', (path: string) => this.handleFileAdded(path))
      .on('change', (path: string) => this.handleFileChanged(path))
      .on('error', (error: unknown) =>
        this.emit(
          'error',
          error instanceof Error ? error : new Error(String(error))
        )
      );

    // Periodic cleanup of inactive sessions
    this.cleanupInterval = setInterval(() => {
      this.cleanupInactiveSessions();
    }, 30000); // Every 30 seconds
  }

  /**
   * Stop watching for changes.
   */
  async stopWatching(): Promise<void> {
    if (!this.isWatching) return;

    this.isWatching = false;
    logger.info('Stopping file monitoring');

    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
    }

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    this.filePositions.clear();
    this.sessionRegistry.clear();
  }

  /**
   * Get list of active sessions.
   */
  getActiveSessions(): ActiveSession[] {
    const now = Date.now();
    return Array.from(this.sessionRegistry.values()).map(session => ({
      sessionId: session.sessionId,
      project: session.project,
      filePath: session.filePath,
      lastModified: session.lastModified,
      isActive: now - session.lastModified.getTime() < this.activeThresholdMs,
    }));
  }

  /**
   * Check if the monitor is currently watching for changes.
   */
  get isWatchingFiles(): boolean {
    return this.isWatching;
  }

  /**
   * Get project directories.
   */
  private async getProjectDirectories(): Promise<string[]> {
    try {
      const entries = await readdir(this.projectsPath, { withFileTypes: true });
      return entries
        .filter(entry => entry.isDirectory())
        .map(entry => join(this.projectsPath, entry.name));
    } catch (error) {
      logger.error(
        { error, path: this.projectsPath },
        'Failed to read projects directory'
      );
      return [];
    }
  }

  /**
   * Get JSONL files in a directory.
   */
  private async getJsonlFiles(dir: string): Promise<string[]> {
    try {
      const entries = await readdir(dir, { withFileTypes: true });
      return entries
        .filter(entry => entry.isFile() && entry.name.endsWith('.jsonl'))
        .map(entry => join(dir, entry.name));
    } catch (error) {
      logger.error({ error, dir }, 'Failed to read directory');
      return [];
    }
  }

  /**
   * Read entries from a file.
   */
  private async *readFile(
    filePath: string,
    fromPosition = 0
  ): AsyncGenerator<LogEntry> {
    const stream = createReadStream(filePath, { start: fromPosition });
    const rl = createInterface({ input: stream });

    let position = fromPosition;

    for await (const line of rl) {
      position += Buffer.byteLength(line) + 1; // +1 for newline

      if (!line.trim()) continue;

      try {
        const rawEntry = JSON.parse(line) as RawLogEntry;
        const entry = this.convertToLogEntry(rawEntry);
        if (entry) {
          yield entry;
        }
      } catch (error) {
        logger.warn({ error, line, filePath }, 'Failed to parse log entry');
      }
    }

    // Update position for this file
    this.filePositions.set(filePath, position);
  }

  /**
   * Scan existing sessions on startup.
   */
  private async scanExistingSessions(): Promise<void> {
    const projectDirs = await this.getProjectDirectories();

    for (const projectDir of projectDirs) {
      const files = await this.getJsonlFiles(projectDir);

      for (const filePath of files) {
        await this.registerSession(filePath);
      }
    }
  }

  /**
   * Register a session file.
   */
  private async registerSession(filePath: string): Promise<void> {
    try {
      const stats = await stat(filePath);
      const sessionId = this.extractSessionId(filePath);
      const project = this.extractProject(filePath);

      const sessionInfo: SessionInfo = {
        sessionId,
        project,
        filePath,
        lastModified: stats.mtime,
        firstSeen: new Date(),
        size: stats.size,
      };

      const isNew = !this.sessionRegistry.has(sessionId);
      this.sessionRegistry.set(sessionId, sessionInfo);

      if (isNew) {
        const activeSession = this.toActiveSession(sessionInfo);
        this.emit('session:new', activeSession);

        if (activeSession.isActive) {
          this.emit('session:active', activeSession);
        }
      }
    } catch (error) {
      logger.error({ error, filePath }, 'Failed to register session');
    }
  }

  /**
   * Handle new file added.
   */
  private async handleFileAdded(filePath: string): Promise<void> {
    logger.debug({ filePath }, 'New file detected');
    await this.registerSession(filePath);

    // Read all entries from new file
    for await (const entry of this.readFile(filePath)) {
      this.emit('entry', entry);
    }
  }

  /**
   * Handle file changed.
   */
  private async handleFileChanged(filePath: string): Promise<void> {
    const position = this.filePositions.get(filePath) || 0;

    // Read only new entries
    for await (const entry of this.readFile(filePath, position)) {
      this.emit('entry', entry);
    }

    // Update session activity
    const sessionId = this.extractSessionId(filePath);
    const session = this.sessionRegistry.get(sessionId);
    if (session) {
      const wasActive = this.isSessionActive(session);
      session.lastModified = new Date();

      const activeSession = this.toActiveSession(session);
      if (!wasActive && activeSession.isActive) {
        this.emit('session:active', activeSession);
      }
    }
  }

  /**
   * Clean up inactive sessions.
   */
  private cleanupInactiveSessions(): void {
    const now = Date.now();

    for (const session of this.sessionRegistry.values()) {
      if (this.isSessionActive(session)) {
        const timeSinceModified = now - session.lastModified.getTime();
        if (timeSinceModified > this.activeThresholdMs) {
          this.emit('session:inactive', this.toActiveSession(session));
        }
      }
    }
  }

  /**
   * Extract session ID from file path.
   */
  private extractSessionId(filePath: string): string {
    const filename = filePath.split('/').pop() || '';
    return filename.replace('.jsonl', '');
  }

  /**
   * Extract project from file path.
   */
  private extractProject(filePath: string): string {
    // Get the parent directory name (encoded project path)
    const parentDir = filePath.split('/').slice(-2, -1)[0];
    if (parentDir) {
      return this.decodeProjectPath(parentDir);
    }
    return 'unknown';
  }

  /**
   * Simple decode of project path.
   */
  private decodeProjectPath(encoded: string): string {
    let decoded = encoded;

    // Handle Windows drive letters (e.g., C--drive becomes C:/drive)
    if (decoded.match(/^[A-Z]--/)) {
      decoded = decoded.replace(/^([A-Z])--/, '$1:/');
    }
    // Handle Unix paths (e.g., -Users becomes /Users)
    else if (decoded.startsWith('-')) {
      decoded = `/${decoded.slice(1)}`;
    }

    // Replace double dashes with dots first (using safe placeholder)
    decoded = decoded.replace(/--/g, '__TEMP_DOT_PLACEHOLDER__');

    // Replace remaining dashes with slashes
    decoded = decoded.replace(/-/g, '/');

    // Replace placeholder with dots
    decoded = decoded.replace(/__TEMP_DOT_PLACEHOLDER__/g, '.');

    return decoded;
  }

  /**
   * Check if session is active.
   */
  private isSessionActive(session: SessionInfo): boolean {
    return Date.now() - session.lastModified.getTime() < this.activeThresholdMs;
  }

  /**
   * Convert SessionInfo to ActiveSession.
   */
  private toActiveSession(session: SessionInfo): ActiveSession {
    return {
      sessionId: session.sessionId,
      project: session.project,
      filePath: session.filePath,
      lastModified: session.lastModified,
      isActive: this.isSessionActive(session),
    };
  }

  /**
   * Convert raw log entry to our domain model.
   */
  private convertToLogEntry(raw: RawLogEntry): LogEntry | null {
    if (!raw.uuid || !raw.type) {
      return null;
    }

    // Extract content from either message.content or direct content field
    let content = raw.content;
    if (raw.message && 'content' in raw.message) {
      content = raw.message.content;
    }

    return {
      uuid: raw.uuid,
      parentUuid: raw.parentUuid || undefined,
      timestamp: raw.timestamp,
      type: raw.type,
      content: content as string | MessageContent | MessageContent[],
      isSidechain: Boolean(raw.isSidechain) ?? false,
    };
  }

  // Type-safe event emitter overrides
  emit<K extends keyof LogMonitorEvents>(
    event: K,
    ...args: Parameters<LogMonitorEvents[K]>
  ): boolean {
    return super.emit(event, ...args);
  }

  on<K extends keyof LogMonitorEvents>(
    event: K,
    listener: LogMonitorEvents[K]
  ): this {
    return super.on(event, listener);
  }

  off<K extends keyof LogMonitorEvents>(
    event: K,
    listener: LogMonitorEvents[K]
  ): this {
    return super.off(event, listener);
  }
}
