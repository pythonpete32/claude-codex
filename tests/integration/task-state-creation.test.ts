import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TDDOptions } from '../../src/shared/types.js';
import { executeTDDWorkflow } from '../../src/workflows/tdd.js';

// Mock external dependencies
vi.mock('../../src/core/claude.js', () => ({
  runAgent: vi.fn().mockResolvedValue({
    messages: [{ role: 'assistant', content: 'Mock agent response' }],
    success: true,
  }),
}));

vi.mock('../../src/core/operations/github.js', () => ({
  checkPRExists: vi.fn().mockResolvedValue({
    number: 123,
    url: 'https://github.com/test/repo/pull/123',
    state: 'open',
    headBranch: 'test-branch',
    baseBranch: 'main',
  }),
}));

vi.mock('../../src/core/operations/worktree.js', () => ({
  createWorktree: vi.fn().mockResolvedValue({
    path: '/tmp/test-worktree',
    branchName: 'test-branch',
    baseBranch: 'main',
  }),
  cleanupWorktree: vi.fn().mockResolvedValue(undefined),
}));

describe('Bug Fix: Task state JSON file creation', () => {
  let tempDir: string;
  let originalCwd: string;

  beforeEach(async () => {
    // Save original working directory
    originalCwd = process.cwd();

    // Create isolated test workspace
    tempDir = await mkdtemp(join(tmpdir(), 'task-state-test-'));
    process.chdir(tempDir);

    // Create test spec file
    await writeFile(
      'test-spec.md',
      `
# Test Feature Implementation
Implement a simple test feature with proper error handling.
    `
    );
  });

  afterEach(async () => {
    // Return to original directory before cleanup
    process.chdir(originalCwd);
    await rm(tempDir, { recursive: true, force: true });
  });

  it('reproduces bug: task state file not created without verbose flag', async () => {
    // This test should FAIL before the bug is fixed

    const options: TDDOptions = {
      specPath: './test-spec.md',
      maxReviews: 1,
      cleanup: false,
    };

    // Execute workflow (simulating non-verbose mode)
    const result = await executeTDDWorkflow(options);

    // Verify task ID was generated
    expect(result.taskId).toBeTruthy();
    expect(result.taskId).toMatch(/^task-\d+-[a-z0-9]+$/);

    // Check that .codex directory exists
    try {
      const codexDir = join(tempDir, '.codex');
      await readFile(codexDir, 'utf-8'); // This should fail - it's a directory
    } catch (_error) {
      // Expected - .codex should be a directory, not a file
    }

    // The critical test: task state file should exist regardless of verbose flag
    const taskStateFile = join(tempDir, '.codex', `${result.taskId}.json`);

    try {
      const taskStateContent = await readFile(taskStateFile, 'utf-8');
      const taskState = JSON.parse(taskStateContent);

      // Verify task state structure
      expect(taskState.taskId).toBe(result.taskId);
      expect(taskState.originalSpec).toContain('Test Feature Implementation');
      expect(taskState.coderResponses).toBeDefined();
      expect(taskState.reviewerResponses).toBeDefined();

      // This should pass - task state file should exist
    } catch (error) {
      // If this fails, we've reproduced the bug
      throw new Error(
        `Task state file not found: ${taskStateFile}. Bug reproduced! Error: ${error}`
      );
    }
  });

  it('should create task state file with consistent task ID', async () => {
    const options: TDDOptions = {
      specPath: './test-spec.md',
      maxReviews: 1,
      cleanup: false,
    };

    const result = await executeTDDWorkflow(options);

    // Read the actual task state file
    const taskStateFile = join(tempDir, '.codex', `${result.taskId}.json`);
    const taskStateContent = await readFile(taskStateFile, 'utf-8');
    const taskState = JSON.parse(taskStateContent);

    // Task IDs should match exactly
    expect(taskState.taskId).toBe(result.taskId);

    // Verify file structure
    expect(taskState).toMatchObject({
      taskId: result.taskId,
      specPath: expect.stringContaining('test-spec.md'),
      originalSpec: expect.stringContaining('Test Feature Implementation'),
      currentIteration: expect.any(Number),
      maxIterations: 1,
      branchName: expect.stringMatching(/^tdd\//),
      worktreeInfo: expect.any(Object),
      coderResponses: expect.any(Array),
      reviewerResponses: expect.any(Array),
      createdAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
      updatedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
      status: 'running',
    });
  });
});
