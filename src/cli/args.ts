/**
 * CLI argument parsing and validation for Claude Codex TDD workflow
 */

export interface TDDCommandArgs {
  specPath: string;
  reviews?: number;
  branch?: string;
  cleanup?: boolean;
  verbose?: boolean;
}

export interface ParsedArgs {
  command?: 'tdd';
  help?: boolean;
  version?: boolean;
  tdd?: TDDCommandArgs;
}

/**
 * Display help text for the CLI
 */
export function displayHelp(): void {
  console.log(`
Claude Codex TDD Workflow CLI

Usage:
  claude-codex tdd <spec-path> [options]
  claude-codex --help
  claude-codex --version

Commands:
  tdd <spec-path>    Run TDD workflow with the given specification file

Options:
  --reviews <num>    Maximum number of review iterations (default: 3)
  --branch <name>    Git branch name for the feature (auto-generated if not provided)
  --no-cleanup      Keep worktree and task state after completion
  --verbose         Enable verbose output for debugging
  --help            Show this help message
  --version         Show version information

Examples:
  claude-codex tdd ./spec.md
  claude-codex tdd ./spec.md --reviews 5 --branch feature/my-feature
  claude-codex tdd ./spec.md --no-cleanup --verbose

Environment Variables:
  GITHUB_TOKEN      Required. GitHub personal access token for PR creation
`);
}

/**
 * Display version information
 */
export function displayVersion(): void {
  // Read version from package.json in production
  console.log('Claude Codex TDD v1.0.0');
}

/**
 * Parse command line arguments into structured format
 */
export function parseArgs(argv: string[]): ParsedArgs {
  const args: ParsedArgs = {};
  const positional: string[] = [];

  // Skip node and script name
  const processedArgs = argv.slice(2);

  for (let i = 0; i < processedArgs.length; i++) {
    const arg = processedArgs[i];

    switch (arg) {
      case '--help':
      case '-h':
        args.help = true;
        break;

      case '--version':
      case '-v':
        args.version = true;
        break;

      case '--reviews': {
        i++;
        if (i >= processedArgs.length) {
          throw new Error('--reviews requires a value');
        }
        const reviewsValue = Number.parseInt(processedArgs[i], 10);
        if (Number.isNaN(reviewsValue) || reviewsValue < 1 || reviewsValue > 10) {
          throw new Error('--reviews must be a number between 1 and 10');
        }
        if (!args.tdd) args.tdd = { specPath: '' };
        args.tdd.reviews = reviewsValue;
        break;
      }

      case '--branch':
        i++;
        if (i >= processedArgs.length) {
          throw new Error('--branch requires a value');
        }
        if (!args.tdd) args.tdd = { specPath: '' };
        args.tdd.branch = processedArgs[i];
        break;

      case '--no-cleanup':
        if (!args.tdd) args.tdd = { specPath: '' };
        args.tdd.cleanup = false;
        break;

      case '--verbose':
        if (!args.tdd) args.tdd = { specPath: '' };
        args.tdd.verbose = true;
        break;

      default:
        if (arg.startsWith('-')) {
          throw new Error(`Unknown option: ${arg}`);
        }
        positional.push(arg);
        break;
    }
  }

  // Handle positional arguments
  if (positional.length > 0) {
    const command = positional[0];

    if (command === 'tdd') {
      args.command = 'tdd';

      if (positional.length < 2) {
        throw new Error('tdd command requires a specification file path');
      }

      if (positional.length > 2) {
        throw new Error('tdd command accepts only one specification file path');
      }

      if (!args.tdd) args.tdd = { specPath: '' };
      args.tdd.specPath = positional[1];

      // Set defaults
      if (args.tdd.reviews === undefined) {
        args.tdd.reviews = 3;
      }
      if (args.tdd.cleanup === undefined) {
        args.tdd.cleanup = true;
      }
      if (args.tdd.verbose === undefined) {
        args.tdd.verbose = false;
      }
    } else {
      throw new Error(`Unknown command: ${command}`);
    }
  }

  return args;
}

/**
 * Validate parsed arguments for consistency and requirements
 */
export function validateArgs(args: ParsedArgs): void {
  // Help and version don't need validation
  if (args.help || args.version) {
    return;
  }

  // Must have a command
  if (!args.command) {
    throw new Error('No command specified. Use --help for usage information.');
  }

  // Validate TDD command arguments
  if (args.command === 'tdd') {
    if (!args.tdd) {
      throw new Error('TDD command arguments missing');
    }

    if (!args.tdd.specPath) {
      throw new Error('Specification file path is required');
    }

    // Validate branch name format if provided
    if (args.tdd.branch) {
      const branchPattern = /^[a-zA-Z0-9/_.-]+$/;
      if (!branchPattern.test(args.tdd.branch)) {
        throw new Error(
          'Branch name contains invalid characters. Use only letters, numbers, /, -, _, and .'
        );
      }
    }
  }
}
