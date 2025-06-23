import { promises as fs } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  addCoderResponse,
  addReviewerResponse,
  cleanupTaskState,
  getTaskState,
  initializeTaskState,
  updateTaskState,
} from '../../../src/core/operations/state.js';
import {
  FileSystemError,
  StateManagementError,
  StateParseError,
  TaskNotFoundError,
  ValidationError,
} from '../../../src/shared/errors.js';

// Mock fs module
vi.mock('node:fs', () => ({
  promises: {
    mkdir: vi.fn(),
    readFile: vi.fn(),
    writeFile: vi.fn(),
    rename: vi.fn(),
    unlink: vi.fn(),
  },
}));

const mockFs = vi.mocked(fs);

describe('State Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initializeTaskState', () => {
    it('should create new task state successfully', async () => {
      const specContent = 'Test specification content';
      mockFs.readFile.mockResolvedValue(specContent);
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      const result = await initializeTaskState('./test-spec.md');

      expect(result.specPath).toBe('./test-spec.md');
      expect(result.originalSpec).toBe(specContent);
      expect(result.taskId).toMatch(/^\d+-[a-z0-9]+$/);
      expect(result.status).toBe('running');
      expect(result.currentIteration).toBe(0);
      expect(result.maxIterations).toBe(3);
      expect(result.coderResponses).toEqual([]);
      expect(result.reviewerResponses).toEqual([]);

      expect(mockFs.mkdir).toHaveBeenCalledWith('.codex', { recursive: true });
      expect(mockFs.writeFile).toHaveBeenCalled();
    });

    it('should accept custom options', async () => {
      const specContent = 'Test specification';
      mockFs.readFile.mockResolvedValue(specContent);
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      const options = {
        taskId: 'custom-123',
        maxIterations: 5,
        branchName: 'feature/test',
      };

      const result = await initializeTaskState('./test-spec.md', options);

      expect(result.taskId).toBe('custom-123');
      expect(result.maxIterations).toBe(5);
      expect(result.branchName).toBe('feature/test');
    });

    it('should throw FileSystemError when spec file not found', async () => {
      const error = new Error('ENOENT: no such file');
      mockFs.readFile.mockRejectedValue(error);

      await expect(initializeTaskState('./missing.md')).rejects.toThrow(FileSystemError);
    });

    it('should throw StateManagementError on other failures', async () => {
      mockFs.readFile.mockResolvedValue('content');
      mockFs.mkdir.mockRejectedValue(new Error('Permission denied'));

      await expect(initializeTaskState('./test.md')).rejects.toThrow(StateManagementError);
    });
  });

  describe('getTaskState', () => {
    it('should retrieve existing task state', async () => {
      const taskState = {
        taskId: 'test-123',
        specPath: './test.md',
        originalSpec: 'spec content',
        currentIteration: 1,
        maxIterations: 3,
        branchName: 'tdd/test-123',
        worktreeInfo: { path: '', branchName: '', baseBranch: '' },
        coderResponses: [],
        reviewerResponses: [],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        status: 'running' as const,
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(taskState));

      const result = await getTaskState('test-123');

      expect(result).toEqual(taskState);
      expect(mockFs.readFile).toHaveBeenCalledWith('.codex/task-test-123.json', 'utf-8');
    });

    it('should throw TaskNotFoundError when file does not exist', async () => {
      const error = new Error('ENOENT: no such file');
      mockFs.readFile.mockRejectedValue(error);

      await expect(getTaskState('missing-123')).rejects.toThrow(TaskNotFoundError);
    });

    it('should throw StateParseError on invalid JSON', async () => {
      mockFs.readFile.mockResolvedValue('invalid json {');

      await expect(getTaskState('test-123')).rejects.toThrow(StateParseError);
    });

    it('should throw ValidationError on invalid state structure', async () => {
      mockFs.readFile.mockResolvedValue(JSON.stringify({ invalid: 'state' }));

      await expect(getTaskState('test-123')).rejects.toThrow(ValidationError);
    });
  });

  describe('updateTaskState', () => {
    it('should update task state atomically', async () => {
      const taskState = {
        taskId: 'test-123',
        specPath: './test.md',
        originalSpec: 'spec content',
        currentIteration: 2,
        maxIterations: 3,
        branchName: 'tdd/test-123',
        worktreeInfo: { path: '', branchName: '', baseBranch: '' },
        coderResponses: ['response1'],
        reviewerResponses: [],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        status: 'running' as const,
      };

      mockFs.writeFile.mockResolvedValue(undefined);
      mockFs.rename.mockResolvedValue(undefined);

      await updateTaskState(taskState);

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        '.codex/task-test-123.json.tmp',
        expect.stringContaining('"taskId": "test-123"')
      );
      expect(mockFs.rename).toHaveBeenCalledWith(
        '.codex/task-test-123.json.tmp',
        '.codex/task-test-123.json'
      );
    });

    it('should update updatedAt timestamp', async () => {
      const taskState = {
        taskId: 'test-123',
        specPath: './test.md',
        originalSpec: 'spec content',
        currentIteration: 1,
        maxIterations: 3,
        branchName: 'tdd/test-123',
        worktreeInfo: { path: '', branchName: '', baseBranch: '' },
        coderResponses: [],
        reviewerResponses: [],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        status: 'running' as const,
      };

      mockFs.writeFile.mockResolvedValue(undefined);
      mockFs.rename.mockResolvedValue(undefined);

      await updateTaskState(taskState);

      expect(taskState.updatedAt).not.toBe('2024-01-01T00:00:00.000Z');
    });
  });

  describe('addCoderResponse', () => {
    it('should add coder response and update iteration', async () => {
      const taskState = {
        taskId: 'test-123',
        specPath: './test.md',
        originalSpec: 'spec content',
        currentIteration: 0,
        maxIterations: 3,
        branchName: 'tdd/test-123',
        worktreeInfo: { path: '', branchName: '', baseBranch: '' },
        coderResponses: [],
        reviewerResponses: [],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        status: 'running' as const,
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(taskState));
      mockFs.writeFile.mockResolvedValue(undefined);
      mockFs.rename.mockResolvedValue(undefined);

      await addCoderResponse('test-123', 'Coder response 1');

      expect(mockFs.writeFile).toHaveBeenCalled();
      const writeCall = mockFs.writeFile.mock.calls[0];
      const savedState = JSON.parse(writeCall[1] as string);

      expect(savedState.coderResponses).toEqual(['Coder response 1']);
      expect(savedState.currentIteration).toBe(1);
    });
  });

  describe('addReviewerResponse', () => {
    it('should add reviewer response', async () => {
      const taskState = {
        taskId: 'test-123',
        specPath: './test.md',
        originalSpec: 'spec content',
        currentIteration: 1,
        maxIterations: 3,
        branchName: 'tdd/test-123',
        worktreeInfo: { path: '', branchName: '', baseBranch: '' },
        coderResponses: ['coder1'],
        reviewerResponses: [],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        status: 'running' as const,
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(taskState));
      mockFs.writeFile.mockResolvedValue(undefined);
      mockFs.rename.mockResolvedValue(undefined);

      await addReviewerResponse('test-123', 'Reviewer response 1');

      expect(mockFs.writeFile).toHaveBeenCalled();
      const writeCall = mockFs.writeFile.mock.calls[0];
      const savedState = JSON.parse(writeCall[1] as string);

      expect(savedState.reviewerResponses).toEqual(['Reviewer response 1']);
    });
  });

  describe('cleanupTaskState', () => {
    it('should remove task state file', async () => {
      mockFs.unlink.mockResolvedValue(undefined);

      await cleanupTaskState('test-123');

      expect(mockFs.unlink).toHaveBeenCalledWith('.codex/task-test-123.json');
    });

    it('should succeed if file already does not exist', async () => {
      const error = new Error('ENOENT: no such file');
      mockFs.unlink.mockRejectedValue(error);

      await expect(cleanupTaskState('test-123')).resolves.toBeUndefined();
    });

    it('should throw StateManagementError on other failures', async () => {
      mockFs.unlink.mockRejectedValue(new Error('Permission denied'));

      await expect(cleanupTaskState('test-123')).rejects.toThrow(StateManagementError);
    });
  });
});
