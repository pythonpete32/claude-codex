import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { initializeTaskState } from '../../src/operations/state.js';
import type { CoordinationOptions } from '../../src/shared/types.js';
import { executeTeamWorkflow } from '../../src/teams/coordinator.js';

// Test using team workflow with tdd team

// Mock external dependencies
vi.mock('../../src/messaging/sdk-wrapper.js', () => ({
  runClaudeAgent: vi.fn().mockResolvedValue({
    messages: [{ role: 'assistant', content: 'Mock agent response' }],
    success: true,
    finalResponse: 'Mock agent response',
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

vi.mock('../../src/core/teams.js', () => ({
  loadTeam: vi.fn().mockResolvedValue({
    CODER: vi.fn((spec: string) => `Mock coder prompt for: ${spec}`),
    REVIEWER: vi.fn((spec: string) => `Mock reviewer prompt for: ${spec}`),
  }),
}));

vi.mock('../../src/core/config.js', () => ({
  loadCodexConfig: vi.fn().mockResolvedValue({
    teams: { tdd: { mcps: [] } },
    mcpServers: {},
    defaults: { team: 'tdd', maxReviews: 3, cleanup: true },
  }),
  getMCPConfigForTeam: vi.fn().mockResolvedValue({ mcpServers: {} }),
}));

describe('Task State ID Consistency Debug', () => {
  let tempDir: string;
  let originalCwd: string;

  beforeEach(async () => {
    originalCwd = process.cwd();
    tempDir = await mkdtemp(join(tmpdir(), 'debug-test-'));
    process.chdir(tempDir);

    await writeFile(
      'test-spec.md',
      `
# Test Feature Implementation
Implement a simple test feature with proper error handling.
    `
    );
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await rm(tempDir, { recursive: true, force: true });
  });

  it('should debug task ID consistency issue', async () => {
    const options: CoordinationOptions = {
      specOrIssue: './test-spec.md',
      teamType: 'tdd',
      maxReviews: 1,
      cleanup: false,
    };

    console.log('Starting workflow execution...');
    const result = await executeTeamWorkflow(options);

    console.log(`Workflow returned task ID: ${result.taskId}`);

    // List all files in .codex directory
    const codexDir = join(tempDir, '.codex');
    try {
      const files = await readdir(codexDir);
      console.log(`Files in .codex directory: ${JSON.stringify(files)}`);

      // Check each file
      for (const file of files) {
        console.log(`Found file: ${file}`);
        if (file.endsWith('.json')) {
          const content = await readFile(join(codexDir, file), 'utf-8');
          const parsed = JSON.parse(content);
          console.log(`File ${file} contains task ID: ${parsed.taskId}`);
        }
      }

      // Try to read the expected file
      const expectedFile = `${result.taskId}.json`;
      console.log(`Looking for expected file: ${expectedFile}`);

      if (files.includes(expectedFile)) {
        console.log('✅ Expected file found');
      } else {
        console.log('❌ Expected file NOT found');
        console.log('This indicates a task ID mismatch bug!');
      }
    } catch (error) {
      console.log(`Error reading .codex directory: ${error}`);
    }
  });

  it('should test state initialization directly', async () => {
    const specPath = join(tempDir, 'test-spec.md');
    const customTaskId = 'custom-test-task-123';

    console.log(`Initializing state with custom task ID: ${customTaskId}`);

    const taskState = await initializeTaskState(specPath, {
      taskId: customTaskId,
      maxIterations: 1,
    });

    console.log(`State initialization returned task ID: ${taskState.taskId}`);

    // Check if the task ID was honored
    expect(taskState.taskId).toBe(customTaskId);

    // Check what file was actually created
    const codexDir = join(tempDir, '.codex');
    const files = await readdir(codexDir);
    console.log(`Files created: ${JSON.stringify(files)}`);

    const expectedFile = `${customTaskId}.json`;
    expect(files).toContain(expectedFile);
  });
});
