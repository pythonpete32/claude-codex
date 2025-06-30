import {
  describe,
  it,
  expect,
  beforeEach,
  vi,
  afterEach,
  type MockedFunction,
} from 'vitest';
import { join } from 'node:path';
import { ProjectResolver } from '../../src/services/project-resolver';
import * as fs from 'node:fs/promises';

// Mock fs/promises
vi.mock('node:fs/promises');

// Mock the logger
vi.mock('@claude-codex/utils', () => ({
  createChildLogger: vi.fn(() => ({
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

describe('ProjectResolver', () => {
  let resolver: ProjectResolver;
  const mockLogsDir = '/home/user/.claude/projects';

  beforeEach(() => {
    resolver = new ProjectResolver(mockLogsDir);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Git Strategy', () => {
    it('should resolve project path from git worktree config', async () => {
      const encodedPath = '-Users-john-my-project';
      const gitConfig = `
[core]
  worktree = /Users/john/my-project
  repositoryformatversion = 0
`;

      vi.mocked(fs.readFile).mockResolvedValueOnce(gitConfig);

      const result = await resolver.resolveProject(encodedPath);

      expect(result).toEqual({
        encodedPath,
        realPath: '/Users/john/my-project',
        confidence: 0.95,
        resolutionMethod: 'git',
        metadata: {},
      });

      expect(fs.readFile).toHaveBeenCalledWith(
        join(mockLogsDir, encodedPath, '.git', 'config'),
        'utf-8'
      );
    });

    it('should extract git remote URL for additional context', async () => {
      const encodedPath = '-Users-jane-awesome-repo';
      const gitConfig = `
[remote "origin"]
  url = https://github.com/jane/awesome-repo.git
  fetch = +refs/heads/*:refs/remotes/origin/*
`;

      vi.mocked(fs.readFile).mockResolvedValueOnce(gitConfig);

      const result = await resolver.resolveProject(encodedPath);

      expect(result).toEqual({
        encodedPath,
        realPath: '/Users/jane/awesome/repo',
        confidence: 0.85,
        resolutionMethod: 'git',
        metadata: {
          gitRemote: 'https://github.com/jane/awesome-repo.git',
        },
      });
    });

    it('should handle git strategy failure gracefully', async () => {
      const encodedPath = '-some-project';

      vi.mocked(fs.readFile).mockRejectedValueOnce(new Error('ENOENT'));
      vi.mocked(fs.readdir).mockRejectedValueOnce(new Error('ENOENT'));

      const result = await resolver.resolveProject(encodedPath);

      expect(result.resolutionMethod).toBe('simple');
      expect(result.confidence).toBe(0.3);
    });
  });

  describe('Package Strategy', () => {
    it('should resolve project from package.json', async () => {
      const encodedPath = '-Users-dev-my-awesome-app';
      const packageJson = JSON.stringify({
        name: 'my-awesome-app',
        version: '1.0.0',
        description: 'An awesome application',
      });

      vi.mocked(fs.readFile)
        .mockRejectedValueOnce(new Error('No git')) // Git strategy fails
        .mockResolvedValueOnce(packageJson); // package.json succeeds

      const result = await resolver.resolveProject(encodedPath);

      expect(result).toEqual({
        encodedPath,
        realPath: '/Users/dev/my/awesome/app',
        confidence: 0.85, // Boosted because name matches
        resolutionMethod: 'package',
        metadata: {
          packageName: 'my-awesome-app',
        },
      });
    });

    it('should handle other package files', async () => {
      const encodedPath = '-home-user-go-project';

      vi.mocked(fs.readFile)
        .mockRejectedValueOnce(new Error('No git'))
        .mockRejectedValueOnce(new Error('No package.json'))
        .mockResolvedValueOnce('module example.com/project'); // go.mod

      const result = await resolver.resolveProject(encodedPath);

      expect(result).toEqual({
        encodedPath,
        realPath: '/home/user/go/project',
        confidence: 0.75,
        resolutionMethod: 'package',
        metadata: {},
      });
    });
  });

  describe('Log Strategy', () => {
    it('should resolve project from log entry cwd field', async () => {
      const encodedPath = '-var-projects-backend';
      const logEntry = JSON.stringify({
        uuid: 'test-123',
        type: 'user',
        cwd: '/var/projects/backend',
        timestamp: '2024-01-01T00:00:00Z',
      });

      vi.mocked(fs.readFile)
        .mockRejectedValueOnce(new Error('No git'))
        .mockRejectedValueOnce(new Error('No package'));

      vi.mocked(fs.readdir).mockResolvedValueOnce(['session-123.jsonl']);
      vi.mocked(fs.readFile).mockResolvedValueOnce(logEntry + '\n');

      const result = await resolver.resolveProject(encodedPath);

      expect(result).toEqual({
        encodedPath,
        realPath: '/var/projects/backend',
        confidence: 0.95,
        resolutionMethod: 'logs',
        metadata: {
          workingDirectory: '/var/projects/backend',
        },
      });
    });

    it('should handle malformed log entries', async () => {
      const encodedPath = '-test-project';

      vi.mocked(fs.readFile)
        .mockRejectedValueOnce(new Error('No git'))
        .mockRejectedValueOnce(new Error('No package'));

      vi.mocked(fs.readdir).mockResolvedValueOnce(['session.jsonl']);
      vi.mocked(fs.readFile).mockResolvedValueOnce('invalid json\n{}\n');

      const result = await resolver.resolveProject(encodedPath);

      expect(result.resolutionMethod).toBe('simple');
      expect(result.confidence).toBe(0.3);
    });
  });

  describe('Simple Decode Strategy', () => {
    it('should decode basic path patterns', async () => {
      const testCases = [
        {
          encoded: '-Users-john-projects',
          expected: '/Users/john/projects',
        },
        {
          encoded: '-home-user-my--config',
          expected: '/home/user/my.config',
        },
        {
          encoded: 'C--Users-jane-work',
          expected: 'C:/Users/jane/work',
        },
      ];

      // Make all other strategies fail
      vi.mocked(fs.readFile).mockRejectedValue(new Error('Not found'));
      vi.mocked(fs.readdir).mockRejectedValue(new Error('Not found'));

      for (const { encoded, expected } of testCases) {
        const result = await resolver.resolveProject(encoded);
        expect(result.realPath).toBe(expected);
        expect(result.confidence).toBe(0.3);
        expect(result.resolutionMethod).toBe('simple');
      }
    });
  });

  describe('Caching', () => {
    it('should cache resolved projects', async () => {
      const encodedPath = '-cached-project';

      vi.mocked(fs.readFile).mockRejectedValue(new Error('Not found'));
      vi.mocked(fs.readdir).mockRejectedValue(new Error('Not found'));

      // First call
      const result1 = await resolver.resolveProject(encodedPath);

      // Second call should use cache
      const result2 = await resolver.resolveProject(encodedPath);

      expect(result1).toEqual(result2);
      expect(fs.readFile).toHaveBeenCalledTimes(2); // Only from first call
    });

    it('should clear cache when requested', async () => {
      const encodedPath = '-test-cache';

      vi.mocked(fs.readFile).mockRejectedValue(new Error('Not found'));
      vi.mocked(fs.readdir).mockRejectedValue(new Error('Not found'));

      await resolver.resolveProject(encodedPath);

      const stats1 = resolver.getCacheStats();
      expect(stats1.size).toBe(1);
      expect(stats1.entries).toContain(encodedPath);

      resolver.clearCache();

      const stats2 = resolver.getCacheStats();
      expect(stats2.size).toBe(0);
      expect(stats2.entries).toEqual([]);
    });
  });

  describe('Strategy Priority', () => {
    it('should prefer higher confidence strategies', async () => {
      const encodedPath = '-Users-test-project';
      const gitConfig = 'url = https://github.com/test/project.git';
      const packageJson = JSON.stringify({ name: 'other-name' });
      const logEntry = JSON.stringify({ cwd: '/Users/test/project' });

      // All strategies succeed
      vi.mocked(fs.readFile)
        .mockResolvedValueOnce(gitConfig) // Git: 0.85 confidence
        .mockResolvedValueOnce(packageJson); // Package: 0.7 confidence

      vi.mocked(fs.readdir).mockResolvedValueOnce(['log.jsonl']);
      vi.mocked(fs.readFile).mockResolvedValueOnce(logEntry); // Log: 0.95 confidence

      const result = await resolver.resolveProject(encodedPath);

      // Should use log strategy (highest confidence)
      expect(result.resolutionMethod).toBe('logs');
      expect(result.confidence).toBe(0.95);
      expect(result.realPath).toBe('/Users/test/project');
    });
  });
});
