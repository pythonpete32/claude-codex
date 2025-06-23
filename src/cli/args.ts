import type { ParsedArgs, TDDCommandArgs } from '../shared/types.js';

export function parseArgs(argv: string[]): ParsedArgs {
  const args = argv.slice(2); // Remove 'node' and script path
  const result: ParsedArgs = {};

  if (args.length === 0) {
    return result;
  }

  // Handle help and version flags
  if (args.includes('--help') || args.includes('-h')) {
    result.help = true;
    return result;
  }

  if (args.includes('--version') || args.includes('-v')) {
    result.version = true;
    return result;
  }

  // Check for tdd command
  if (args[0] === 'tdd') {
    result.command = 'tdd';
    result.tdd = parseTDDArgs(args.slice(1));
  }

  return result;
}

function parseTDDArgs(args: string[]): TDDCommandArgs {
  const tddArgs: TDDCommandArgs = {
    specPath: '',
  };

  let i = 0;
  while (i < args.length) {
    const arg = args[i];

    if (arg.startsWith('--')) {
      // Handle long flags
      switch (arg) {
        case '--reviews':
          if (i + 1 < args.length) {
            const reviews = Number.parseInt(args[i + 1], 10);
            if (!Number.isNaN(reviews) && reviews > 0) {
              tddArgs.reviews = reviews;
            }
            i++; // Skip the value
          }
          break;

        case '--branch':
          if (i + 1 < args.length) {
            tddArgs.branch = args[i + 1];
            i++; // Skip the value
          }
          break;

        case '--no-cleanup':
          tddArgs.cleanup = false;
          break;

        case '--cleanup':
          tddArgs.cleanup = true;
          break;

        case '--verbose':
          tddArgs.verbose = true;
          break;

        default:
          // Unknown flag, ignore
          break;
      }
    } else if (arg.startsWith('-')) {
      // Handle short flags
      switch (arg) {
        case '-r':
          if (i + 1 < args.length) {
            const reviews = Number.parseInt(args[i + 1], 10);
            if (!Number.isNaN(reviews) && reviews > 0) {
              tddArgs.reviews = reviews;
            }
            i++; // Skip the value
          }
          break;

        case '-b':
          if (i + 1 < args.length) {
            tddArgs.branch = args[i + 1];
            i++; // Skip the value
          }
          break;

        case '--verbose':
          tddArgs.verbose = true;
          break;

        default:
          // Unknown flag, ignore
          break;
      }
    } else {
      // Positional argument - should be spec path
      if (!tddArgs.specPath) {
        tddArgs.specPath = arg;
      }
    }

    i++;
  }

  return tddArgs;
}

export function printHelp(): void {
  console.log(`
Claude Codex - TDD Workflow Automation

USAGE:
  claude-codex tdd <spec-file> [OPTIONS]

COMMANDS:
  tdd <spec-file>      Run TDD workflow on specification file

OPTIONS:
  -r, --reviews <num>  Maximum number of review iterations (default: 3)
  -b, --branch <name>  Custom branch name (default: auto-generated)
  --cleanup           Clean up worktree on completion (default: true)
  --no-cleanup        Preserve worktree after completion
  -v, --verbose       Enable verbose output
  -h, --help          Show this help message
  --version           Show version information

EXAMPLES:
  claude-codex tdd ./my-feature.md
  claude-codex tdd ./my-feature.md --reviews 5
  claude-codex tdd ./my-feature.md --branch feature/my-feature --no-cleanup
  claude-codex tdd ./my-feature.md --verbose

ENVIRONMENT:
  GITHUB_TOKEN        GitHub personal access token (required)

For more information, visit: https://github.com/abuusama/claude-codex
`);
}

export function printVersion(): void {
  // This would typically read from package.json
  console.log('claude-codex v0.1.1');
}
