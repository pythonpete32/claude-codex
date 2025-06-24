import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import {
  FileSystemError,
  StateManagementError,
  StateParseError,
  TaskNotFoundError,
  ValidationError,
} from '~/shared/errors.js';
import type { TaskState, WorktreeInfo } from '~/shared/types.js';

const CODEX_DIR = '.codex';

/**
 * Generate unique task ID with timestamp and random suffix
 */
function generateTaskId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `task-${timestamp}-${random}`;
}

/**
 * Get path to task state file
 */
function getTaskStatePath(taskId: string): string {
  return join(CODEX_DIR, `${taskId}.json`);
}

/**
 * Validate task state structure
 */
function validateTaskState(state: unknown): asserts state is TaskState {
  if (!state || typeof state !== 'object') {
    throw new ValidationError('Task state must be an object');
  }

  const s = state as Record<string, unknown>;

  if (typeof s.taskId !== 'string') {
    throw new ValidationError('taskId must be a string');
  }

  if (typeof s.specOrIssue !== 'string') {
    throw new ValidationError('specOrIssue must be a string');
  }

  if (typeof s.teamType !== 'string') {
    throw new ValidationError('teamType must be a string');
  }

  if (typeof s.currentIteration !== 'number') {
    throw new ValidationError('currentIteration must be a number');
  }

  if (typeof s.maxIterations !== 'number') {
    throw new ValidationError('maxIterations must be a number');
  }

  if (typeof s.branchName !== 'string') {
    throw new ValidationError('branchName must be a string');
  }

  // Old arrays removed - teams now communicate via files

  if (typeof s.createdAt !== 'string') {
    throw new ValidationError('createdAt must be a string');
  }

  if (typeof s.updatedAt !== 'string') {
    throw new ValidationError('updatedAt must be a string');
  }

  const validStatuses = ['running', 'completed', 'failed'];
  if (typeof s.status !== 'string' || !validStatuses.includes(s.status)) {
    throw new ValidationError('status must be running, completed, or failed');
  }
}

/**
 * Ensure .codex directory exists
 */
async function ensureCodexDirectory(): Promise<void> {
  try {
    await fs.mkdir(CODEX_DIR, { recursive: true });
  } catch (error) {
    throw new FileSystemError(
      'create directory',
      CODEX_DIR,
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Write task state to file atomically using temporary file + rename
 */
async function writeTaskStateAtomic(taskState: TaskState): Promise<void> {
  await ensureCodexDirectory();

  const statePath = getTaskStatePath(taskState.taskId);
  const tempPath = `${statePath}.tmp`;

  try {
    // Write to temporary file first
    const stateJson = JSON.stringify(taskState, null, 2);
    await fs.writeFile(tempPath, stateJson, 'utf8');

    // Atomically rename to final location
    await fs.rename(tempPath, statePath);
  } catch (error) {
    // Clean up temp file if it exists
    try {
      await fs.unlink(tempPath);
    } catch {
      // Ignore cleanup errors
    }

    throw new FileSystemError(
      'write task state',
      statePath,
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Initialize new task state and return complete TaskState object
 */
export async function initializeTaskState(
  specOrIssue: string,
  options: Partial<TaskState> = {}
): Promise<TaskState> {
  try {
    // Read specification file

    // Use provided task ID or generate new one
    const taskId = options.taskId || generateTaskId();
    const now = new Date().toISOString();

    const taskState: TaskState = {
      taskId,
      specOrIssue: specOrIssue, // Spec file or GitHub issue reference
      teamType: 'tdd', // Default to TDD for backward compatibility
      currentIteration: 0,
      maxIterations: 3,
      branchName: `tdd/${taskId}`,
      worktreeInfo: {
        path: '',
        branchName: '',
        baseBranch: '',
      },
      createdAt: now,
      updatedAt: now,
      status: 'running',
      ...options,
    };

    // Validate and write to file
    validateTaskState(taskState);
    await writeTaskStateAtomic(taskState);

    return taskState;
  } catch (error) {
    if (error instanceof ValidationError || error instanceof FileSystemError) {
      throw error;
    }
    throw new StateManagementError(
      error instanceof Error ? error.message : 'Unknown error during task state initialization',
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Retrieve existing task state from file
 */
export async function getTaskState(taskId: string): Promise<TaskState> {
  const statePath = getTaskStatePath(taskId);

  try {
    const stateJson = await fs.readFile(statePath, 'utf8');
    const parsedState: unknown = JSON.parse(stateJson);

    validateTaskState(parsedState);
    return parsedState;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw new StateParseError(taskId, error);
    }

    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      throw new TaskNotFoundError(taskId);
    }

    if (error instanceof SyntaxError) {
      throw new StateParseError(taskId, error);
    }

    throw new StateManagementError(
      `Failed to retrieve task state: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Update task state with new data and timestamp
 */
export async function updateTaskState(taskState: TaskState): Promise<void> {
  try {
    // Update timestamp and validate
    taskState.updatedAt = new Date().toISOString();
    validateTaskState(taskState);

    // Write atomically
    await writeTaskStateAtomic(taskState);
  } catch (error) {
    if (error instanceof ValidationError || error instanceof FileSystemError) {
      throw error;
    }
    throw new StateManagementError(
      `Failed to update task state: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Update worktree information in existing task state
 */
export async function updateWorktreeInfo(
  taskId: string,
  worktreeInfo: WorktreeInfo
): Promise<void> {
  try {
    const taskState = await getTaskState(taskId);
    taskState.worktreeInfo = worktreeInfo;
    await updateTaskState(taskState);
  } catch (error) {
    if (error instanceof TaskNotFoundError || error instanceof StateParseError) {
      throw error;
    }
    throw new StateManagementError(
      `Failed to update worktree info: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Remove task state file from filesystem
 */
export async function cleanupTaskState(taskId: string): Promise<void> {
  const statePath = getTaskStatePath(taskId);

  try {
    await fs.unlink(statePath);
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      // File doesn't exist, nothing to clean up
      return;
    }
    throw new FileSystemError(
      'delete task state',
      statePath,
      error instanceof Error ? error : undefined
    );
  }
}
