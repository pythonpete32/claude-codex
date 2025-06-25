import { copyFile, mkdir, readdir } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pathExists } from '~/shared/utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Find the templates directory by checking multiple possible locations
 */
async function findTemplatesDirectory(): Promise<string> {
  // Try different possible template locations in order of likelihood
  const possiblePaths = [
    join(__dirname, '..', 'templates'), // Development: src/templates
    join(__dirname, 'templates'), // Production bundle: dist/templates
    join(process.cwd(), 'dist', 'templates'), // Alternative production path
    join(process.cwd(), 'templates'), // Direct templates folder
  ];

  for (const templatePath of possiblePaths) {
    if (await pathExists(templatePath)) {
      return templatePath;
    }
  }

  throw new Error(
    `Templates directory not found. Checked the following locations:\n${possiblePaths.map((p) => `  - ${p}`).join('\n')}\n\nPlease reinstall claude-codex or report this issue.`
  );
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

  // Find templates directory dynamically
  const TEMPLATES_DIR = await findTemplatesDirectory();

  // Create directories
  await mkdir(teamsDir, { recursive: true });
  await mkdir(commandsDir, { recursive: true });

  // Create default config (if doesn't exist or force)
  if (!options.teamsOnly && (!(await pathExists(configPath)) || options.force)) {
    const templateConfigPath = join(TEMPLATES_DIR, '.codex.config.json');
    await copyFile(templateConfigPath, configPath);
    console.log('✅ Created config:', configPath);
  }

  // Create default teams
  if (!options.configOnly) {
    const teamsTemplateDir = join(TEMPLATES_DIR, 'teams');
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
    const commandsTemplateDir = join(TEMPLATES_DIR, 'commands');
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
