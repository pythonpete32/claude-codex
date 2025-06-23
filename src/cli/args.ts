/**
 * CLI argument parsing for Claude Codex
 * Supports both direct Claude interaction and TDD workflow commands
 */

export interface TDDCommandArgs {
  specPath: string;
  reviews?: number;
  branch?: string;
  cleanup?: boolean;
  verbose?: boolean;
}

export interface ParsedArgs {
  // Global flags
  help?: boolean;
  version?: boolean;
  verbose?: boolean;

  // Command routing
  command?: 'tdd';

  // TDD command arguments
  tdd?: TDDCommandArgs;

  // Direct Claude interaction (existing behavior)
  directMode?: boolean;
  prompt?: string;
}

/**
 * Displays help text for the CLI
 */
export function showHelp(): string {
  return `
Claude Codex - AI-powered development automation

USAGE:
  claude-codex [OPTIONS] [COMMAND]
  claude-codex [OPTIONS] <prompt>                 # Direct Claude interaction

COMMANDS:
  tdd <spec-file>                                 # Run TDD workflow

TDD OPTIONS:
  --reviews <number>                              # Max review iterations (default: 3)
  --branch <name>                                 # Custom branch name
  --no-cleanup                                    # Keep worktree and state after completion
  --verbose                                       # Enable detailed output

GLOBAL OPTIONS:
  --help, -h                                      # Show this help message
  --version, -v                                   # Show version information
  --verbose                                       # Enable verbose output

EXAMPLES:
  claude-codex tdd ./my-feature.md                # Run TDD workflow
  claude-codex tdd ./spec.md --reviews 5          # Run with 5 review iterations
  claude-codex tdd ./spec.md --branch feat/x      # Use custom branch name
  claude-codex "Help me debug this code"          # Direct Claude interaction

ENVIRONMENT:
  GITHUB_TOKEN                                    # Required for TDD workflow
  
For more information, visit: https://github.com/abuusama/claude-codex
`.trim();
}

/**
 * Displays version information
 */
export function showVersion(): string {
  // Read version from package.json in production, fallback for development
  return '0.1.1';
}

/**
 * Parses command line arguments into structured format
 */
export function parseArgs(args: string[]): ParsedArgs {
  const result: ParsedArgs = {};

  let i = 0;
  while (i < args.length) {
    const arg = args[i];

    switch (arg) {
      case '--help':
      case '-h': {
        result.help = true;
        break;
      }

      case '--version':
      case '-v': {
        result.version = true;
        break;
      }

      case '--verbose': {
        result.verbose = true;
        break;
      }

      case 'tdd': {
        result.command = 'tdd';
        result.tdd = parseTDDArgs(args.slice(i + 1));
        // Skip remaining args since they're handled by parseTDDArgs
        return result;
      }

      default: {
        // If no command matched and this isn't a flag, treat as direct prompt
        if (!arg.startsWith('-') && !result.command) {
          result.directMode = true;
          result.prompt = args.slice(i).join(' ');
          return result;
        }

        // Unknown flag, skip it
        break;
      }
    }

    i++;
  }

  return result;
}

/**
 * Parses TDD-specific command arguments
 */
function parseTDDArgs(args: string[]): TDDCommandArgs {
  if (args.length === 0) {
    throw new Error('TDD command requires a specification file path');
  }

  const result: TDDCommandArgs = {
    specPath: args[0],
    cleanup: true, // Default to cleanup enabled
  };

  let i = 1;
  while (i < args.length) {
    const arg = args[i];

    switch (arg) {
      case '--reviews': {
        const next = args[i + 1];
        if (!next || Number.isNaN(Number.parseInt(next, 10))) {
          throw new Error('--reviews requires a valid number');
        }
        result.reviews = Number.parseInt(next, 10);
        if (result.reviews < 1 || result.reviews > 10) {
          throw new Error('--reviews must be between 1 and 10');
        }
        i++; // Skip the number argument
        break;
      }

      case '--branch': {
        const next = args[i + 1];
        if (!next || next.startsWith('-')) {
          throw new Error('--branch requires a branch name');
        }
        result.branch = next;
        i++; // Skip the branch name argument
        break;
      }

      case '--no-cleanup': {
        result.cleanup = false;
        break;
      }

      case '--verbose': {
        result.verbose = true;
        break;
      }

      default: {
        if (arg.startsWith('-')) {
          throw new Error(`Unknown TDD option: ${arg}`);
        }
        // Ignore non-flag arguments after spec path
        break;
      }
    }

    i++;
  }

  return result;
}

/**
 * Validates parsed arguments and throws descriptive errors
 */
export function validateArgs(args: ParsedArgs): void {
  if (args.command === 'tdd' && !args.tdd) {
    throw new Error('Internal error: TDD command missing arguments');
  }

  if (args.tdd) {
    const { specPath } = args.tdd;

    if (!specPath || specPath.trim().length === 0) {
      throw new Error('Specification file path cannot be empty');
    }

    // Basic path validation
    if (specPath.includes('..') && !specPath.startsWith('./') && !specPath.startsWith('/')) {
      throw new Error('Specification file path contains invalid characters');
    }
  }
}
