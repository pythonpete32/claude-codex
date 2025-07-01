/**
 * Type definitions for test fixture data.
 * These types represent the raw data format from Claude Code logs
 * that parsers need to transform into UI-ready props.
 */

import type { MessageContent } from './entities';
import type { RawLogEntry, RawToolResult } from './ui-props';

/**
 * Raw fixture data exactly as it appears in the JSON files
 * This preserves ALL fields from the actual Claude Code logs
 */
export interface FixtureToolCall {
  parentUuid: string;
  isSidechain: boolean;
  userType: string;
  cwd: string;
  sessionId: string;
  version: string;
  type: 'assistant';
  timestamp: string;
  message: {
    id: string;
    type: string;
    role: string;
    model: string;
    content: MessageContent[];
    usage: {
      input_tokens: number;
      cache_creation_input_tokens: number;
      cache_read_input_tokens: number;
      output_tokens: number;
      service_tier: string;
    };
  };
  requestId: string;
  uuid: string;
}

export interface FixtureToolResult {
  parentUuid: string;
  isSidechain: boolean;
  userType: string;
  cwd: string;
  sessionId: string;
  version: string;
  type: 'user';
  timestamp: string;
  message: {
    role: string;
    content: MessageContent[];
  };
  uuid: string;
  // Note: In real fixture data, timestamp appears twice at this level
  // We only define it once in TypeScript to avoid duplicate identifier error
  toolUseResult?: unknown; // Raw output that varies by tool
}

/**
 * Base fixture format for all tools
 */
export interface BaseFixture<TExpectedData = Record<string, unknown>> {
  toolCall: FixtureToolCall;
  toolResult: FixtureToolResult;
  expectedComponentData: TExpectedData;
}

/**
 * Edit tool fixture format
 */
export interface EditFixture extends BaseFixture<{
  id: string;
  uuid: string;
  parentUuid: string;
  timestamp: string;
  status: {
    normalized: string;
    original: string;
  };
  filePath: string;
  oldContent: string;
  newContent: string;
  diff: Array<{
    oldStart: number;
    oldLines: number;
    newStart: number;
    newLines: number;
    lines: string[];
  }>;
}> {
  // Edit fixtures have structured toolUseResult
  toolResult: FixtureToolResult & {
    toolUseResult?: {
      filePath: string;
      oldString: string;
      newString: string;
      originalFile: string;
      structuredPatch: Array<{
        oldStart: number;
        oldLines: number;
        newStart: number;
        newLines: number;
        lines: string[];
      }>;
      userModified: boolean;
      replaceAll: boolean;
    };
  };
}

/**
 * Bash tool fixture format
 */
export interface BashFixture extends BaseFixture<{
  id: string;
  uuid: string;
  parentUuid: string;
  timestamp: string;
  status: {
    normalized: string;
    original: string;
  };
  command: string;
  output: string;
  exitCode: number;
  workingDirectory: string;
}> {
  toolResult: FixtureToolResult & {
    toolUseResult?: {
      type: string;
      command: string;
      exitCode: number;
      output?: string;
      error?: string;
    };
  };
}

/**
 * Read tool fixture format
 */
export interface ReadFixture extends BaseFixture<{
  id: string;
  uuid: string;
  parentUuid: string;
  timestamp: string;
  status: {
    normalized: string;
    original: string;
  };
  filePath: string;
  content: string;
  totalLines: number;
  fileSize: number;
  fileType: string;
}> {}

/**
 * Write tool fixture format
 */
export interface WriteFixture extends BaseFixture<{
  id: string;
  uuid: string;
  parentUuid: string;
  timestamp: string;
  status: {
    normalized: string;
    original: string;
  };
  filePath: string;
  content: string;
  created: boolean;
  overwritten: boolean;
  fileType: string;
}> {}

/**
 * Glob tool fixture format
 */
export interface GlobFixture extends BaseFixture<{
  id: string;
  uuid: string;
  parentUuid: string;
  timestamp: string;
  status: {
    normalized: string;
    original: string;
  };
  pattern: string;
  path: string;
  files: string[];
  totalMatches: number;
  filesWithMatches: number;
}> {
  toolResult: FixtureToolResult & {
    toolUseResult?: {
      filenames: string[];
    };
  };
}

/**
 * Grep tool fixture format
 */
export interface GrepFixture extends BaseFixture<{
  id: string;
  uuid: string;
  parentUuid: string;
  timestamp: string;
  status: {
    normalized: string;
    original: string;
  };
  pattern: string;
  searchPath: string;
  matches: Array<{
    filePath: string;
    lineNumber: number;
    content: string;
    preview?: string;
  }>;
  totalMatches: number;
  filesWithMatches: number;
}> {}

/**
 * LS tool fixture format
 */
export interface LsFixture extends BaseFixture<{
  id: string;
  uuid: string;
  parentUuid: string;
  timestamp: string;
  status: {
    normalized: string;
    original: string;
  };
  path: string;
  entries: Array<{
    name: string;
    type: 'file' | 'directory' | 'symlink';
    size: number;
    permissions: string;
    lastModified: string;
    isHidden: boolean;
  }>;
  totalFiles: number;
  totalDirectories: number;
  totalSize: number;
}> {}

/**
 * MultiEdit tool fixture format  
 */
export interface MultiEditFixture extends BaseFixture<{
  id: string;
  uuid: string;
  parentUuid: string;
  timestamp: string;
  status: {
    normalized: string;
    original: string;
  };
  filePath: string;
  editsApplied: number;
  totalEdits: number;
  allSuccessful: boolean;
  changes: Array<{
    oldContent: string;
    newContent: string;
    success: boolean;
  }>;
}> {}

/**
 * TodoRead tool fixture format
 */
export interface TodoReadFixture extends BaseFixture<{
  id: string;
  uuid: string;
  parentUuid: string;
  timestamp: string;
  status: {
    normalized: string;
    original: string;
  };
  todos: Array<{
    id: string;
    content: string;
    status: 'pending' | 'in_progress' | 'completed';
    priority: 'high' | 'medium' | 'low';
    createdAt: string;
    tags?: string[];
  }>;
  statusCounts: {
    pending: number;
    in_progress: number;
    completed: number;
  };
  priorityCounts: {
    high: number;
    medium: number;
    low: number;
  };
}> {}

/**
 * TodoWrite tool fixture format
 */
export interface TodoWriteFixture extends BaseFixture<{
  id: string;
  uuid: string;
  parentUuid: string;
  timestamp: string;
  status: {
    normalized: string;
    original: string;
  };
  operation: 'create' | 'update' | 'replace';
  todosModified: number;
  todos: Array<{
    id: string;
    content: string;
    status: 'pending' | 'in_progress' | 'completed';
    priority: 'high' | 'medium' | 'low';
  }>;
}> {}

/**
 * Fixture data container format (as loaded from JSON files)
 */
export interface FixtureData<T extends BaseFixture> {
  toolName: string;
  category: string;
  priority: string;
  fixtureCount: number;
  fixtures: T[];
}