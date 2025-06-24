import { readdir } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { Team } from '~/shared/types.js';
import { pathExists } from '~/shared/utils.js';

/**
 * Load all teams from ~/.claude/teams/
 */
export async function loadAllTeams(): Promise<Record<string, Team>> {
  const teamsDir = join(homedir(), '.claude', 'teams');

  if (!(await pathExists(teamsDir))) {
    throw new Error(
      `Teams directory not found: ${teamsDir}. Run 'claude-codex init' to create it.`
    );
  }

  const teamFiles = await readdir(teamsDir);
  const teams: Record<string, Team> = {};

  for (const file of teamFiles) {
    if (file.endsWith('.ts')) {
      const teamName = file.replace('.ts', '');
      const teamPath = join(teamsDir, file);

      try {
        // Dynamic import of team module
        const teamModule = await import(teamPath);

        if (!teamModule.default) {
          console.warn(`⚠️ Team file ${file} has no default export, skipping`);
          continue;
        }

        // Validate team structure
        const team = teamModule.default;
        if (!team.CODER || !team.REVIEWER) {
          console.warn(`⚠️ Team ${teamName} missing CODER or REVIEWER, skipping`);
          continue;
        }

        if (typeof team.CODER !== 'function' || typeof team.REVIEWER !== 'function') {
          console.warn(`⚠️ Team ${teamName} CODER/REVIEWER must be functions, skipping`);
          continue;
        }

        teams[teamName] = team;
      } catch (error) {
        console.warn(
          `⚠️ Failed to load team ${teamName}:`,
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    }
  }

  return teams;
}

/**
 * Load a specific team by name
 */
export async function loadTeam(teamName: string): Promise<Team> {
  const teams = await loadAllTeams();
  const team = teams[teamName];

  if (!team) {
    const availableTeams = Object.keys(teams);
    throw new Error(`Team "${teamName}" not found. Available teams: ${availableTeams.join(', ')}`);
  }

  return team;
}

/**
 * Validate team exists in configuration
 */
export function validateTeamExists(teamType: string, teams: Record<string, Team>): boolean {
  return teamType in teams;
}

/**
 * List all available team names
 */
export async function listAvailableTeams(): Promise<string[]> {
  try {
    const teams = await loadAllTeams();
    return Object.keys(teams).sort();
  } catch {
    return [];
  }
}
