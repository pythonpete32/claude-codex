import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listAvailableTeams, loadAllTeams, loadTeam } from '../../src/teams/loader.js';

describe('Team Loading System', () => {
  let tempDir: string;
  let originalHomedir: string;

  beforeEach(async () => {
    // Create temporary home directory for tests
    tempDir = await mkdtemp(join(tmpdir(), 'teams-test-'));

    // Mock os.homedir to return our temp directory
    originalHomedir = process.env.HOME || '';
    process.env.HOME = tempDir;

    // Create .claude/teams directory structure
    const claudeDir = join(tempDir, '.claude');
    const teamsDir = join(claudeDir, 'teams');
    await mkdir(teamsDir, { recursive: true });

    // Create test team files
    await writeFile(
      join(teamsDir, 'tdd.ts'),
      `
const CODER = (spec) => \`Implementing: \${spec}\`;
const REVIEWER = (spec) => \`Reviewing: \${spec}\`;
const TEAM = { CODER, REVIEWER };
export default TEAM;
`
    );

    await writeFile(
      join(teamsDir, 'frontend.ts'),
      `
const CODER = (spec) => \`Frontend coding: \${spec}\`;
const REVIEWER = (spec) => \`Frontend review: \${spec}\`;
const TEAM = { CODER, REVIEWER };
export default TEAM;
`
    );

    await writeFile(
      join(teamsDir, 'invalid.ts'),
      `
// Invalid team file - no default export
const CODER = (spec) => spec;
`
    );

    await writeFile(
      join(teamsDir, 'invalid-structure.ts'),
      `
const TEAM = { CODER: "not a function" };
export default TEAM;
`
    );
  });

  afterEach(async () => {
    // Restore original home directory
    process.env.HOME = originalHomedir;

    // Clean up temp directory
    await rm(tempDir, { recursive: true, force: true });

    vi.clearAllMocks();
  });

  describe('loadAllTeams', () => {
    it('should load all valid team files', async () => {
      const teams = await loadAllTeams();

      expect(Object.keys(teams)).toContain('tdd');
      expect(Object.keys(teams)).toContain('frontend');
      expect(Object.keys(teams)).not.toContain('invalid');
      expect(Object.keys(teams)).not.toContain('invalid-structure');
    });

    it('should validate team structure', async () => {
      const teams = await loadAllTeams();

      expect(teams.tdd).toMatchObject({
        CODER: expect.any(Function),
        REVIEWER: expect.any(Function),
      });

      expect(teams.frontend).toMatchObject({
        CODER: expect.any(Function),
        REVIEWER: expect.any(Function),
      });
    });

    it('should handle missing teams directory gracefully', async () => {
      // Remove the teams directory
      await rm(join(tempDir, '.claude', 'teams'), { recursive: true, force: true });

      await expect(loadAllTeams()).rejects.toThrow('Teams directory not found');
    });

    it('should skip non-TypeScript files', async () => {
      const teamsDir = join(tempDir, '.claude', 'teams');
      await writeFile(join(teamsDir, 'readme.md'), '# Teams');
      await writeFile(join(teamsDir, 'config.json'), '{}');

      const teams = await loadAllTeams();

      expect(Object.keys(teams)).not.toContain('readme');
      expect(Object.keys(teams)).not.toContain('config');
    });
  });

  describe('loadTeam', () => {
    it('should load specific team by name', async () => {
      const team = await loadTeam('tdd');

      expect(team).toMatchObject({
        CODER: expect.any(Function),
        REVIEWER: expect.any(Function),
      });

      expect(team.CODER('test spec')).toBe('Implementing: test spec');
      expect(team.REVIEWER('test spec')).toBe('Reviewing: test spec');
    });

    it('should throw error for non-existent team', async () => {
      await expect(loadTeam('non-existent')).rejects.toThrow(
        'Team "non-existent" not found. Available teams: frontend, tdd'
      );
    });

    it('should list available teams in error message', async () => {
      try {
        await loadTeam('missing');
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.message).toContain('Available teams:');
        expect(error.message).toContain('tdd');
        expect(error.message).toContain('frontend');
      }
    });
  });

  describe('listAvailableTeams', () => {
    it('should return sorted list of team names', async () => {
      const teams = await listAvailableTeams();

      expect(teams).toEqual(['frontend', 'tdd']);
    });

    it('should return empty array when teams directory missing', async () => {
      await rm(join(tempDir, '.claude'), { recursive: true, force: true });

      const teams = await listAvailableTeams();

      expect(teams).toEqual([]);
    });
  });

  describe('Team Function Execution', () => {
    it('should execute team functions with correct parameters', async () => {
      const team = await loadTeam('frontend');

      const coderPrompt = team.CODER('Build a React component');
      const reviewerPrompt = team.REVIEWER('Build a React component');

      expect(coderPrompt).toBe('Frontend coding: Build a React component');
      expect(reviewerPrompt).toBe('Frontend review: Build a React component');
    });

    it('should handle complex specifications', async () => {
      const team = await loadTeam('tdd');
      const complexSpec = 'Implement user authentication with OAuth2 and JWT tokens';

      const result = team.CODER(complexSpec);

      expect(result).toContain(complexSpec);
    });
  });
});
