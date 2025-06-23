import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import {
  FileSystemError,
  StateManagementError,
  StateParseError,
  TaskNotFoundError,
  ValidationError,
} from '../../shared/errors.js';
import type { TaskState } from '../../shared/types.js';

const CODEX_DIR = '.codex';

function generateTaskId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}`;
}

function getTaskStatePath(taskId: string): string {
  return join(CODEX_DIR, `task-${taskId}.json`);
}

async function ensureCodexDirectory(): Promise<void> {
  try {
    await fs.mkdir(CODEX_DIR, { recursive: true });
  } catch (error) {
    throw new FileSystemError(`Failed to create .codex directory: ${error}`, 'mkdir');
  }
}

function validateTaskState(state: unknown): TaskState {
  if (!state || typeof state !== 'object') {
    throw new ValidationError('Task state must be an object');
  }

  const s = state as Record<string, unknown>;

  const required = [
    'taskId',
    'specPath',
    'originalSpec',
    'currentIteration',
    'maxIterations',
    'branchName',
    'worktreeInfo',
    'coderResponses',
    'reviewerResponses',
    'createdAt',
    'updatedAt',
    'status',
  ];

  for (const field of required) {
    if (!(field in s)) {
      throw new ValidationError(`Missing required field: ${field}`);
    }
  }

  if (typeof s.taskId !== 'string') {
    throw new ValidationError('taskId must be a string');
  }

  if (!['running', 'completed', 'failed'].includes(s.status as string)) {
    throw new ValidationError('status must be running, completed, or failed');
  }

  return s as TaskState;
}

export async function initializeTaskState(
  specPath: string,
  options: Partial<TaskState> = {}
): Promise<TaskState> {
  try {
    const specContent = await fs.readFile(specPath, 'utf-8');

    await ensureCodexDirectory();

    const taskId = options.taskId || generateTaskId();
    const now = new Date().toISOString();

    const taskState: TaskState = {
      taskId,
      specPath,
      originalSpec: specContent,
      currentIteration: 0,
      maxIterations: options.maxIterations || 3,
      branchName: options.branchName || `tdd/${taskId}`,
      worktreeInfo: options.worktreeInfo || {
        path: '',
        branchName: '',
        baseBranch: '',
      },
      coderResponses: [],
      reviewerResponses: [],
      createdAt: now,
      updatedAt: now,
      status: 'running',
      ...options,
    };

    const statePath = getTaskStatePath(taskId);
    await fs.writeFile(statePath, JSON.stringify(taskState, null, 2));

    return taskState;
  } catch (error) {
    if (error instanceof Error && error.message.includes('ENOENT')) {
      throw new FileSystemError(`Specification file not found: ${specPath}`, 'readFile');
    }
    throw new StateManagementError(`Failed to initialize task state: ${error}`);
  }
}

export async function getTaskState(taskId: string): Promise<TaskState> {
  try {
    const statePath = getTaskStatePath(taskId);
    const content = await fs.readFile(statePath, 'utf-8');
    const state = JSON.parse(content);
    return validateTaskState(state);
  } catch (error) {
    if (error instanceof Error && error.message.includes('ENOENT')) {
      throw new TaskNotFoundError(taskId);
    }
    if (error instanceof SyntaxError) {
      throw new StateParseError(taskId, error);
    }
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new StateManagementError(`Failed to get task state for ${taskId}: ${error}`);
  }
}

export async function updateTaskState(taskState: TaskState): Promise<void> {
  try {
    taskState.updatedAt = new Date().toISOString();
    const statePath = getTaskStatePath(taskState.taskId);

    // Atomic write using temp file + rename
    const tempPath = `${statePath}.tmp`;
    await fs.writeFile(tempPath, JSON.stringify(taskState, null, 2));
    await fs.rename(tempPath, statePath);
  } catch (error) {
    throw new StateManagementError(`Failed to update task state for ${taskState.taskId}: ${error}`);
  }
}

export async function addCoderResponse(taskId: string, response: string): Promise<void> {
  try {
    const taskState = await getTaskState(taskId);
    taskState.coderResponses.push(response);
    taskState.currentIteration = taskState.coderResponses.length;
    await updateTaskState(taskState);
  } catch (error) {
    throw new StateManagementError(`Failed to add coder response for ${taskId}: ${error}`);
  }
}

export async function addReviewerResponse(taskId: string, response: string): Promise<void> {
  try {
    const taskState = await getTaskState(taskId);
    taskState.reviewerResponses.push(response);
    await updateTaskState(taskState);
  } catch (error) {
    throw new StateManagementError(`Failed to add reviewer response for ${taskId}: ${error}`);
  }
}

export async function cleanupTaskState(taskId: string): Promise<void> {
  try {
    const statePath = getTaskStatePath(taskId);
    await fs.unlink(statePath);
  } catch (error) {
    if (error instanceof Error && error.message.includes('ENOENT')) {
      // File already doesn't exist, cleanup successful
      return;
    }
    throw new StateManagementError(`Failed to cleanup task state for ${taskId}: ${error}`);
  }
}
