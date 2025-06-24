import { copyFile, mkdir, readdir } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pathExists } from '~/shared/utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Try different possible template locations for different build/runtime contexts
const possibleTemplatePaths = [
  join(__dirname, '..', 'templates'), // Development: src/templates
  join(__dirname, 'templates'), // Production: dist/templates
  join(__dirname, '..', 'dist', 'templates'), // Alternative production path
];

let TEMPLATES_DIR: string | null = null;

// Find the correct templates directory
async function findTemplatesDir(): Promise<string> {
  if (TEMPLATES_DIR) return TEMPLATES_DIR;

  for (const templatePath of possibleTemplatePaths) {
    if (await pathExists(templatePath)) {
      TEMPLATES_DIR = templatePath;
      return TEMPLATES_DIR;
    }
  }

  throw new Error('Templates directory not found. Please reinstall claude-codex.');
}

export interface InitOptions {
  force?: boolean;
  teamsOnly?: boolean;
  configOnly?: boolean;
}

/**
 * Initialize Claude Codex configuration and teams
 */
export async function initializeClaudeCodex(options: InitOptions = {}): Promise<void> {
  const claudeDir = join(homedir(), '.claude');
  const teamsDir = join(claudeDir, 'teams');
  const commandsDir = join(claudeDir, 'commands');
  const configPath = join(claudeDir, '.codex.config.json');

  // Get the correct templates directory
  const templatesDir = await findTemplatesDir();

  // Create directories
  await mkdir(teamsDir, { recursive: true });
  await mkdir(commandsDir, { recursive: true });

  // Create default config (if doesn't exist or force)
  if (!options.teamsOnly && (!(await pathExists(configPath)) || options.force)) {
    const templateConfigPath = join(templatesDir, '.codex.config.json');
    await copyFile(templateConfigPath, configPath);
    console.log('✅ Created config:', configPath);
  }

  // Create default teams
  if (!options.configOnly) {
    const teamsTemplateDir = join(templatesDir, 'teams');
    const teamFiles = await readdir(teamsTemplateDir);

    for (const teamFile of teamFiles) {
      if (teamFile.endsWith('.ts')) {
        const teamPath = join(teamsDir, teamFile);
        if (!(await pathExists(teamPath)) || options.force) {
          const templatePath = join(teamsTemplateDir, teamFile);
          await copyFile(templatePath, teamPath);
          console.log('✅ Created team:', teamPath);
        }
      }
    }
  }

  // Create example commands
  if (!options.configOnly) {
    const commandsTemplateDir = join(templatesDir, 'commands');
    const commandFiles = await readdir(commandsTemplateDir);

    for (const commandFile of commandFiles) {
      const commandPath = join(commandsDir, commandFile);
      if (!(await pathExists(commandPath)) || options.force) {
        const templatePath = join(commandsTemplateDir, commandFile);
        await copyFile(templatePath, commandPath);
        console.log('✅ Created command:', commandPath);
      }
    }
  }

  console.log('\n🎉 Claude Codex initialized successfully!');
  console.log('\nNext steps:');
  console.log('1. Edit ~/.claude/.codex.config.json to add your GitHub token');
  console.log('2. Run: claude-codex ./spec.md --team standard');
  console.log('3. Add custom teams in ~/.claude/teams/');
}
