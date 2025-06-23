import { z } from 'zod';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { pathExists } from '../shared/utils.js';

/**
 * MCP Server schema (reusable)
 */
export const MCPServerSchema = z.object({
  command: z.string(),
  args: z.array(z.string()).optional(),
  env: z.record(z.string()).optional(),
});

/**
 * MCP Config schema (Claude SDK compatible)
 */
export const MCPConfigSchema = z.object({
  mcpServers: z.record(MCPServerSchema),
});

/**
 * Zod schema for Claude Codex configuration
 */
export const CodexConfigSchema = z.object({
  // Standard MCP format (same as Claude Code)
  mcpServers: z.record(MCPServerSchema).optional(),

  // Team-specific configurations
  teams: z.record(z.object({
    mcps: z.array(z.string()),                    // MCP server names enabled for this team
  })),

  // Global defaults
  defaults: z.object({
    team: z.string().default('standard'),         // Default team, but any team name is valid
    maxReviews: z.number().min(1).max(10).default(3),
    cleanup: z.boolean().default(true),
  }),
});

/**
 * TypeScript types derived from Zod schemas
 */
export type CodexConfig = z.infer<typeof CodexConfigSchema>;
export type ClaudeSDKMCPConfig = z.infer<typeof MCPConfigSchema>;

/**
 * Load and validate Claude Codex configuration
 */
export async function loadCodexConfig(): Promise<CodexConfig> {
  const configPath = join(homedir(), '.claude', '.codex.config.json');
  
  if (!await pathExists(configPath)) {
    throw new Error(`Config file not found: ${configPath}. Run 'claude-codex init' to create it.`);
  }

  const configContent = await readFile(configPath, 'utf-8');
  const rawConfig = JSON.parse(configContent);
  
  // Validate and parse with Zod
  const result = CodexConfigSchema.safeParse(rawConfig);
  
  if (!result.success) {
    throw new Error(`Invalid config file: ${result.error.message}`);
  }
  
  return result.data;
}

/**
 * Get MCP configuration for a specific team
 */
export async function getMCPConfigForTeam(
  teamType: string,
  config: CodexConfig
): Promise<ClaudeSDKMCPConfig> {
  const teamConfig = config.teams[teamType];
  if (!teamConfig) {
    throw new Error(`Team "${teamType}" not found in config`);
  }

  // Filter MCP servers to only include those enabled for this team
  const enabledMCPServers: Record<string, any> = {};

  for (const mcpName of teamConfig.mcps) {
    if (config.mcpServers?.[mcpName]) {
      enabledMCPServers[mcpName] = config.mcpServers[mcpName];
    }
  }

  return {
    mcpServers: enabledMCPServers
  };
}