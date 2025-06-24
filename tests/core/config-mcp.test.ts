import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getMCPConfigForTeam } from '../../src/core/config.js';
import type { CodexConfig } from '../../src/core/config.js';

describe('MCP Configuration Integration', () => {
  const mockConfig: CodexConfig = {
    mcpServers: {
      'snap-happy': {
        command: 'npx',
        args: ['@mariozechner/snap-happy'],
        env: {
          SNAP_HAPPY_SCREENSHOT_PATH: '~/Screenshots',
        },
      },
      'web-scraper': {
        command: 'node',
        args: ['./web-scraper.js'],
        env: {},
      },
    },
    teams: {
      standard: { mcps: ['snap-happy'] },
      tdd: { mcps: ['snap-happy'] },
      frontend: { mcps: ['snap-happy', 'web-scraper'] },
      'smart-contract': { mcps: [] },
    },
    defaults: {
      team: 'standard',
      maxReviews: 3,
      cleanup: true,
    },
  };

  describe('getMCPConfigForTeam', () => {
    it('should return correct MCP config for standard team', async () => {
      const result = await getMCPConfigForTeam('standard', mockConfig);
      
      expect(result.mcpServers).toEqual({
        'snap-happy': {
          command: 'npx',
          args: ['@mariozechner/snap-happy'],
          env: {
            SNAP_HAPPY_SCREENSHOT_PATH: '~/Screenshots',
          },
        },
      });
    });

    it('should return correct MCP config for frontend team', async () => {
      const result = await getMCPConfigForTeam('frontend', mockConfig);
      
      expect(result.mcpServers).toEqual({
        'snap-happy': {
          command: 'npx',
          args: ['@mariozechner/snap-happy'],
          env: {
            SNAP_HAPPY_SCREENSHOT_PATH: '~/Screenshots',
          },
        },
        'web-scraper': {
          command: 'node',
          args: ['./web-scraper.js'],
          env: {},
        },
      });
    });

    it('should return empty MCP config for smart-contract team', async () => {
      const result = await getMCPConfigForTeam('smart-contract', mockConfig);
      
      expect(result.mcpServers).toEqual({});
    });

    it('should return empty MCP config for unknown team', async () => {
      const result = await getMCPConfigForTeam('unknown-team', mockConfig);
      
      expect(result.mcpServers).toEqual({});
    });

    it('should handle missing team config gracefully', async () => {
      const configWithoutTeams: CodexConfig = {
        ...mockConfig,
        teams: {},
      };
      
      const result = await getMCPConfigForTeam('standard', configWithoutTeams);
      
      expect(result.mcpServers).toEqual({});
    });

    it('should handle missing MCP server definitions', async () => {
      const configWithMissingMCP: CodexConfig = {
        ...mockConfig,
        teams: {
          standard: { mcps: ['non-existent-mcp'] },
        },
      };
      
      const result = await getMCPConfigForTeam('standard', configWithMissingMCP);
      
      expect(result.mcpServers).toEqual({});
    });
  });

  describe('MCP Integration with Teams', () => {
    it('should provide team-specific tool configurations', async () => {
      // Frontend teams get UI testing tools
      const frontendConfig = await getMCPConfigForTeam('frontend', mockConfig);
      expect(Object.keys(frontendConfig.mcpServers)).toContain('snap-happy');
      expect(Object.keys(frontendConfig.mcpServers)).toContain('web-scraper');
      
      // Smart contract teams get no additional tools (focus on security)
      const smartContractConfig = await getMCPConfigForTeam('smart-contract', mockConfig);
      expect(Object.keys(smartContractConfig.mcpServers)).toHaveLength(0);
    });

    it('should maintain MCP server environment variables', async () => {
      const result = await getMCPConfigForTeam('standard', mockConfig);
      
      expect(result.mcpServers['snap-happy'].env).toEqual({
        SNAP_HAPPY_SCREENSHOT_PATH: '~/Screenshots',
      });
    });
  });
});