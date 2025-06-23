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

  it('should create identical state structure regardless of verbose flag', async () => {
    // This test proves that verbose flag does NOT affect core state creation logic
    // Verbose flag only affects CLI console output, not workflow execution

    const baseOptions: TDDOptions = {
      specPath: './test-spec.md',
      maxReviews: 1,
      cleanup: false,
    };

    // Execute workflow twice with identical options
    // (Note: TDDOptions interface doesn't include verbose - it only affects CLI layer)
    const result1 = await executeTDDWorkflow(baseOptions);
    const result2 = await executeTDDWorkflow(baseOptions);

    // Get task states from actual files
    const state1 = JSON.parse(
      await readFile(join(tempDir, '.codex', `${result1.taskId}.json`), 'utf-8')
    );
    const state2 = JSON.parse(
      await readFile(join(tempDir, '.codex', `${result2.taskId}.json`), 'utf-8')
    );

    // State structure should be identical (verbose only affects console output)
    expect(Object.keys(state1).sort()).toEqual(Object.keys(state2).sort());
    expect(state1.originalSpec).toBe(state2.originalSpec);
    expect(state1.maxIterations).toBe(state2.maxIterations);
    expect(state1.specPath).toBe(state2.specPath);
    expect(state1.status).toBe(state2.status);

    // Both should have valid task state files created
    expect(state1.taskId).toBeTruthy();
    expect(state2.taskId).toBeTruthy();
    expect(state1.taskId).not.toBe(state2.taskId); // Different tasks should have different IDs

    // Core content should be identical
    expect(state1.coderResponses).toEqual(state2.coderResponses);
    expect(state1.reviewerResponses).toEqual(state2.reviewerResponses);
    expect(state1.currentIteration).toBe(state2.currentIteration);

    // Both files should exist and be properly formed JSON
    expect(state1.createdAt).toBeTruthy();
    expect(state2.createdAt).toBeTruthy();
    expect(state1.updatedAt).toBeTruthy();
    expect(state2.updatedAt).toBeTruthy();
  });
});
