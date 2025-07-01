import { readdir, readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { createChildLogger } from '@claude-codex/utils';

// Create logger for this module
const logger = createChildLogger('project-resolver');

/**
 * Project information resolved from encoded paths
 */
export interface ResolvedProject {
  /** Encoded project path (as stored by Claude) */
  encodedPath: string;
  /** Best guess at the real project path */
  realPath: string;
  /** How confident we are in the resolution (0-1) */
  confidence: number;
  /** Method used to resolve the path */
  resolutionMethod: 'git' | 'package' | 'logs' | 'simple' | 'fallback';
  /** Additional metadata found during resolution */
  metadata?: {
    gitRemote?: string;
    packageName?: string;
    workingDirectory?: string;
  };
}

/**
 * Resolves encoded project paths to their real filesystem paths.
 * Since Claude encodes paths in a lossy way, we use various strategies
 * to determine the actual project location.
 */
export class ProjectResolver {
  private logsDir: string;
  private cache = new Map<string, ResolvedProject>();

  constructor(logsDir?: string) {
    this.logsDir = logsDir || join(homedir(), '.claude', 'projects');
    logger.info({ logsDir: this.logsDir }, 'ProjectResolver initialized');
  }

  /**
   * Resolve an encoded project path to its real location.
   */
  async resolveProject(encodedPath: string): Promise<ResolvedProject> {
    // Check cache first
    const cached = this.cache.get(encodedPath);
    if (cached) {
      logger.debug({ encodedPath }, 'Returning cached project resolution');
      return cached;
    }

    const fullPath = join(this.logsDir, encodedPath);
    logger.debug({ encodedPath, fullPath }, 'Resolving project path');

    // Try strategies in order of reliability
    let result: ResolvedProject | null = null;

    // Strategy 1: Check for .git/config
    result = await this.tryGitStrategy(encodedPath, fullPath);
    if (result && result.confidence > 0.8) {
      this.cache.set(encodedPath, result);
      return result;
    }

    // Strategy 2: Check for package.json, go.mod, etc.
    const packageResult = await this.tryPackageStrategy(encodedPath, fullPath);
    if (packageResult && packageResult.confidence > (result?.confidence || 0)) {
      result = packageResult;
    }

    // Strategy 3: Check first log entry for working directory hints
    const logResult = await this.tryLogStrategy(encodedPath, fullPath);
    if (logResult && logResult.confidence > (result?.confidence || 0)) {
      result = logResult;
    }

    // Strategy 4: Simple decode
    if (!result || result.confidence < 0.5) {
      result = this.simpleDecodeStrategy(encodedPath);
    }

    this.cache.set(encodedPath, result);
    logger.info(
      {
        encodedPath,
        resolvedPath: result.realPath,
        confidence: result.confidence,
        method: result.resolutionMethod,
      },
      'Project resolved'
    );

    return result;
  }

  /**
   * Strategy 1: Use git config to find the real path.
   */
  private async tryGitStrategy(
    encodedPath: string,
    projectDir: string
  ): Promise<ResolvedProject | null> {
    try {
      const configPath = join(projectDir, '.git', 'config');
      const gitConfig = await readFile(configPath, 'utf-8');

      // Look for worktree configuration
      const worktreeMatch = gitConfig.match(/worktree = (.+)/);
      if (worktreeMatch) {
        return {
          encodedPath,
          realPath: worktreeMatch[1].trim(),
          confidence: 0.95,
          resolutionMethod: 'git',
          metadata: {},
        };
      }

      // Extract remote URL for additional context
      const urlMatch = gitConfig.match(/url = (.+)/);
      const gitRemote = urlMatch ? urlMatch[1].trim() : undefined;

      // If we have a remote, we can make educated guesses
      if (gitRemote) {
        const repoNameMatch = gitRemote.match(/([^/]+?)(?:\.git)?$/);
        if (repoNameMatch) {
          // Use simple decode but boost confidence due to git presence
          const decoded = this.simpleDecode(encodedPath);
          return {
            encodedPath,
            realPath: decoded,
            confidence: 0.85,
            resolutionMethod: 'git',
            metadata: { gitRemote },
          };
        }
      }
    } catch (error) {
      // Git strategy failed, try next
      logger.debug({ error, encodedPath }, 'Git strategy failed');
    }

    return null;
  }

  /**
   * Strategy 2: Use package files to infer project location.
   */
  private async tryPackageStrategy(
    encodedPath: string,
    projectDir: string
  ): Promise<ResolvedProject | null> {
    try {
      // Check for various package files
      const packageFiles = ['package.json', 'go.mod', 'Cargo.toml', 'pom.xml'];

      for (const fileName of packageFiles) {
        try {
          const filePath = join(projectDir, fileName);
          const content = await readFile(filePath, 'utf-8');

          if (fileName === 'package.json') {
            const pkg = JSON.parse(content);
            const packageName = pkg.name;

            // Some heuristics based on package name
            const decoded = this.simpleDecode(encodedPath);
            let confidence = 0.7;

            // Boost confidence if package name matches part of the path
            if (
              packageName &&
              decoded.toLowerCase().includes(packageName.toLowerCase())
            ) {
              confidence = 0.85;
            }

            return {
              encodedPath,
              realPath: decoded,
              confidence,
              resolutionMethod: 'package',
              metadata: { packageName },
            };
          }

          // For other package files, just knowing they exist helps
          const decoded = this.simpleDecode(encodedPath);
          return {
            encodedPath,
            realPath: decoded,
            confidence: 0.75,
            resolutionMethod: 'package',
            metadata: {},
          };
        } catch {
          // Try next package file
        }
      }
    } catch (error) {
      logger.debug({ error, encodedPath }, 'Package strategy failed');
    }

    return null;
  }

  /**
   * Strategy 3: Check log entries for working directory hints.
   */
  private async tryLogStrategy(
    encodedPath: string,
    projectDir: string
  ): Promise<ResolvedProject | null> {
    try {
      // Find the first JSONL file
      const files = await readdir(projectDir);
      const jsonlFile = files.find(f => f.endsWith('.jsonl'));

      if (!jsonlFile) {
        return null;
      }

      // Read first few lines to find working directory
      const logPath = join(projectDir, jsonlFile);
      const content = await readFile(logPath, 'utf-8');
      const lines = content.split('\n').slice(0, 10);

      for (const line of lines) {
        if (!line.trim()) continue;

        try {
          const entry = JSON.parse(line);

          // Look for cwd field
          if (entry.cwd) {
            return {
              encodedPath,
              realPath: entry.cwd,
              confidence: 0.95,
              resolutionMethod: 'logs',
              metadata: { workingDirectory: entry.cwd },
            };
          }
        } catch {
          // Invalid JSON, skip
        }
      }
    } catch (error) {
      logger.debug({ error, encodedPath }, 'Log strategy failed');
    }

    return null;
  }

  /**
   * Strategy 4: Simple character replacement decode.
   */
  private simpleDecodeStrategy(encodedPath: string): ResolvedProject {
    return {
      encodedPath,
      realPath: this.simpleDecode(encodedPath),
      confidence: 0.3,
      resolutionMethod: 'simple',
      metadata: {},
    };
  }

  /**
   * Basic decoding of Claude's path encoding.
   * This is lossy and may not be accurate.
   */
  private simpleDecode(encoded: string): string {
    // Basic rules observed:
    // - First dash becomes /
    // - Subsequent dashes become /
    // - Double dash becomes .

    let decoded = encoded;

    // Handle Windows drive letters (e.g., C--Users becomes C:/Users)
    if (decoded.match(/^[A-Z]--/)) {
      decoded = decoded.replace(/^([A-Z])--/, '$1:/');
    }
    // Handle Unix paths (e.g., -Users becomes /Users)
    else if (decoded.startsWith('-')) {
      decoded = `/${decoded.slice(1)}`;
    }

    // Replace double dashes with dots first (before single dash replacement)
    decoded = decoded.replace(/--/g, '__TEMP_DOT_PLACEHOLDER__'); // Safe temporary placeholder

    // Replace remaining dashes with slashes
    decoded = decoded.replace(/-/g, '/');

    // Replace placeholder with dots
    decoded = decoded.replace(/__TEMP_DOT_PLACEHOLDER__/g, '.');

    return decoded;
  }

  /**
   * Clear the resolution cache.
   */
  clearCache(): void {
    this.cache.clear();
    logger.debug('Project resolution cache cleared');
  }

  /**
   * Get cache statistics.
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }
}
