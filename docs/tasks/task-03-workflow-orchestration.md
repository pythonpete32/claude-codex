# Task 03: Workflow Orchestration & CLI Integration

## Overview
Implement the main TDD workflow orchestrator and CLI integration that brings together all components to deliver the complete TDD automation experience. This is the final integration task that connects the foundation and operations layers into a working end-to-end system.

## Architecture Reference
**IMPORTANT**: This task implements components specified in the [**SPEC.md**](../SPEC.md) document, which is the **single source of truth** for the TDD workflow implementation.

Specifically references:
- [SPEC - TDD Workflow Orchestrator](../SPEC.md#tdd-workflow-orchestrator-workflowstddts)
- [SPEC - High-Level Architectural Structure](../SPEC.md#high-level-architectural-structure)
- [TDD PRD - CLI Interface](../claude-codex-tdd-prd.md#cli-interface)
- [TDD PRD - Core Workflow](../claude-codex-tdd-prd.md#core-workflow)

**All implementation must follow the SPEC.md document exactly. Do not deviate from the specification.**

## Prerequisites
- **Task 01** (Foundation Layer) must be completed and tested
- **Task 02** (Operations Layer) must be completed and tested
- All foundation types, Claude SDK wrapper, and operations functions are available
- Test coverage for dependencies is ≥90%

## Scope
Create the orchestration and CLI components that deliver the complete user experience:

1. **TDD Workflow Orchestrator** (`src/workflows/tdd.ts`)
2. **TDD CLI Command Handler** (`src/cli/commands/tdd.ts`)
3. **CLI Integration** (extend `src/cli/args.ts` and `src/index.ts`)
4. **Environment Validation** (`src/shared/preflight.ts`)

## Requirements

### 1. TDD Workflow Orchestrator (`src/workflows/tdd.ts`)
**Objective**: Coordinate the complete TDD agent workflow from specification to pull request.

**Main Function**: Implement `executeTDDWorkflow` as specified in [TDD Workflow Orchestrator section of SPEC.md](../SPEC.md#tdd-workflow-orchestrator-workflowstddts).

**Workflow Implementation Pattern**:
```typescript
export async function executeTDDWorkflow(options: TDDOptions): Promise<TDDResult> {
  const taskId = generateTaskId();
  let worktreeInfo: WorktreeInfo | null = null;
  
  try {
    // 1. Initialize task state and worktree
    const taskState = await initializeTaskState(options.specPath, { taskId, maxIterations: options.maxReviews });
    worktreeInfo = await createWorktree(taskId, { branchName: options.branchName });
    
    // 2. Agent iteration loop (max iterations)
    for (let iteration = 1; iteration <= options.maxReviews; iteration++) {
      // 2a. Run Coder Agent
      const coderResult = await runAgent({
        prompt: await formatCoderPrompt({ /* context */ }),
        cwd: worktreeInfo.path,
        maxTurns: 5
      });
      
      await addCoderResponse(taskId, coderResult.finalResponse);
      
      // 2b. Run Reviewer Agent  
      const reviewerResult = await runAgent({
        prompt: await formatReviewerPrompt({ /* context */ }),
        cwd: worktreeInfo.path,
        maxTurns: 3
      });
      
      await addReviewerResponse(taskId, reviewerResult.finalResponse);
      
      // 2c. Check for PR creation (success condition)
      const prInfo = await checkPRExists(worktreeInfo.branchName);
      if (prInfo) {
        return { success: true, prUrl: prInfo.url, iterations: iteration, taskId };
      }
      
      // 2d. Extract feedback for next iteration or terminate
      // Implementation details per architecture
    }
    
    // 3. Handle completion/failure scenarios
    return { success: false, iterations: options.maxReviews, taskId, error: 'Max iterations reached' };
    
  } finally {
    // 4. Cleanup based on options.cleanup
    if (options.cleanup && worktreeInfo) {
      await cleanupWorktree(worktreeInfo);
      await cleanupTaskState(taskId);
    }
  }
}
```

**Critical Implementation Requirements**:
- **State Coordination**: All agent responses must be saved to task state
- **Error Recovery**: Graceful handling of agent failures with partial results
- **Cleanup Logic**: Safe cleanup even when workflow fails midway
- **Progress Tracking**: Clear iteration counting and status updates
- **Success Detection**: Reliable PR detection as completion signal

### 2. TDD CLI Command Handler (`src/cli/commands/tdd.ts`)
**Objective**: Handle TDD subcommand parsing, validation, and execution.

**CLI Interface**: Implement interface specified in [TDD PRD - CLI Interface](../claude-codex-tdd-prd.md#cli-interface).

**Command Structure**:
```typescript
export interface TDDCommandArgs {
  specPath: string;
  reviews?: number;
  branch?: string;
  cleanup?: boolean;
  verbose?: boolean;
}

export async function handleTDDCommand(args: TDDCommandArgs): Promise<void> {
  // 1. Validate arguments and environment
  await validateEnvironment();
  
  // 2. Convert CLI args to TDDOptions
  const options: TDDOptions = {
    specPath: path.resolve(args.specPath),
    maxReviews: args.reviews || 3,
    branchName: args.branch,
    cleanup: args.cleanup !== false
  };
  
  // 3. Execute workflow with progress reporting
  console.log('🤖 Claude Codex - Starting TDD Workflow');
  const result = await executeTDDWorkflow(options);
  
  // 4. Report results to user
  if (result.success) {
    console.log(`✅ Success! PR created: ${result.prUrl}`);
  } else {
    console.error(`❌ Failed after ${result.iterations} iterations: ${result.error}`);
  }
}
```

**User Experience Requirements**:
- Clear progress indicators during execution
- Helpful error messages with actionable guidance
- Proper exit codes for CI/CD integration
- Verbose mode for debugging when requested

### 3. CLI Integration (extend existing files)
**Objective**: Integrate TDD command into existing CLI structure.

**Extend `src/cli/args.ts`**:
```typescript
// Add TDD subcommand support to existing argument parser
export interface ParsedArgs {
  // ... existing args
  command?: 'tdd';
  tdd?: TDDCommandArgs;
}
```

**Extend `src/index.ts`**:
```typescript
// Route TDD commands to TDD handler
if (args.command === 'tdd') {
  await handleTDDCommand(args.tdd!);
  return;
}
```

**CLI Help Integration**: Update help text to include TDD command documentation.

### 4. Environment Validation (`src/shared/preflight.ts`)
**Objective**: Validate environment requirements before workflow execution.

**Implementation**: Create `validateEnvironment` function as specified in [Environment Validation section of SPEC.md](../SPEC.md#environment-validation-sharedpreflightts).

**Validation Checks**:
```typescript
export async function validateEnvironment(): Promise<PreflightResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // 1. Git repository validation
  if (!(await isGitRepository())) {
    errors.push('Current directory is not a git repository');
  }
  
  // 2. GitHub token validation
  if (!process.env.GITHUB_TOKEN) {
    errors.push('GITHUB_TOKEN environment variable not set');
  }
  
  // 3. Claude Code authentication check
  // (Implementation strategy: attempt simple query or check for auth files)
  
  // 4. Directory permissions
  // Check write permissions for .codex/ and worktree directories
  
  return { success: errors.length === 0, errors, warnings };
}
```

**User Guidance**: Provide clear instructions for resolving validation failures.

## Testing Strategy

### Unit Tests Required

**Workflow Orchestrator Tests** (`tests/workflows/tdd.test.ts`):
- Mock all dependencies (state management, worktree, GitHub, Claude SDK)
- Test successful workflow completion with PR creation
- Test max iterations scenario without PR creation
- Test early termination on agent failures
- Test cleanup logic in both success and failure scenarios
- Test iteration loop with different feedback scenarios
- Test state management throughout workflow execution

**CLI Command Tests** (`tests/cli/commands/tdd.test.ts`):
- Mock workflow orchestrator execution
- Test argument parsing and validation
- Test file path resolution and validation
- Test progress reporting and user feedback
- Test error scenarios and exit codes
- Test verbose mode output

**CLI Integration Tests** (`tests/cli/args.test.ts` and `tests/cli/index.test.ts`):
- Test TDD subcommand routing
- Test argument passing to TDD handler
- Test help text generation
- Test integration with existing CLI structure

**Environment Validation Tests** (`tests/shared/preflight.test.ts`):
- Mock git repository detection
- Mock environment variable presence
- Mock file system permissions
- Test validation reporting and error messages
- Test warning vs error classification

### Integration Tests Required

**End-to-End Workflow Test**:
```typescript
describe('TDD Workflow Integration', () => {
  it('should complete full workflow with mocked agents', async () => {
    // Setup: temporary git repo, mock GitHub API, mock Claude SDK
    // Execute: full TDD workflow
    // Verify: state persistence, worktree operations, agent coordination
    // Cleanup: temporary resources
  });
});
```

**CLI Integration Test**:
```typescript
describe('CLI Integration', () => {
  it('should handle tdd command end-to-end', async () => {
    // Test CLI parsing → command routing → workflow execution → user feedback
  });
});
```

### Test Setup Requirements
- Mock all external dependencies (git, GitHub API, Claude SDK)
- Use temporary directories for file system operations
- Create test specifications and expected outputs
- Mock console output for user feedback testing

## Definition of Done

### Code Requirements
- [ ] TDD workflow orchestrator implements complete agent coordination loop
- [ ] CLI command handler provides excellent user experience with clear feedback
- [ ] CLI integration seamlessly extends existing argument parsing
- [ ] Environment validation catches all prerequisite issues
- [ ] All error scenarios handled gracefully with helpful messages
- [ ] State management properly coordinates agent handoffs
- [ ] Cleanup logic works correctly in all scenarios

### Testing Requirements
- [ ] Unit test coverage ≥90% for all new components
- [ ] Integration tests verify end-to-end workflow
- [ ] All error scenarios tested with appropriate error handling
- [ ] Mocked dependencies properly isolate units under test
- [ ] CLI user experience tested with various input scenarios

### Quality Requirements
- [ ] Code passes Biome linting and formatting checks
- [ ] No TypeScript compilation errors or warnings
- [ ] User feedback is clear, helpful, and actionable
- [ ] Progress indicators enhance user experience
- [ ] Error messages guide users toward resolution

### Integration Requirements  
- [ ] Workflow orchestrator correctly uses all operations layer functions
- [ ] CLI integration doesn't break existing functionality
- [ ] State management properly persists data across workflow steps
- [ ] Agent coordination follows architecture specifications exactly
- [ ] Components work together without circular dependencies

### User Experience Requirements
- [ ] CLI help text is comprehensive and accurate
- [ ] Progress indicators work during long-running operations
- [ ] Error messages include specific guidance for resolution
- [ ] Success messages provide actionable information (PR URLs)
- [ ] Verbose mode provides useful debugging information

### Performance Requirements
- [ ] Workflow execution completes within reasonable time limits
- [ ] Memory usage is efficient for long-running operations
- [ ] Agent coordination has minimal overhead
- [ ] State management operations are fast and reliable

## Dependencies
- Foundation layer (Task 01): Types, errors, Claude SDK wrapper, state management
- Operations layer (Task 02): Worktree operations, GitHub integration, prompt utilities
- Existing CLI infrastructure: `src/cli/args.ts`, `src/index.ts`

## Environment Requirements
- Git repository with GitHub remote
- `GITHUB_TOKEN` environment variable
- Claude Code CLI authenticated and working
- Write permissions for `.codex/` and worktree directories
- Node.js 18+ runtime environment

## Estimated Effort
**3-4 developer days** for implementation and comprehensive testing.

## Notes for Reviewer
When reviewing this task completion:

1. **Agent Coordination**: Verify that the workflow correctly coordinates between Coder and Reviewer agents with proper state management
2. **Error Recovery**: Ensure all failure scenarios are handled gracefully with helpful user guidance
3. **CLI Experience**: Test the command-line interface for usability and clarity
4. **Cleanup Logic**: Verify that cleanup works correctly in both success and failure scenarios
5. **State Consistency**: Ensure task state remains consistent throughout the workflow
6. **Integration**: Verify that the implementation matches architecture specifications exactly

## Success Criteria
Upon completion, users should be able to run:
```bash
npx claude-codex tdd ./my-spec.md --reviews 5 --branch feature/my-feature
```

And receive either:
- ✅ A working implementation with comprehensive tests and a GitHub pull request
- ❌ Clear error messages with specific guidance for resolution

## Future Enhancements
This implementation provides the foundation for future workflow additions:
- Code review workflow
- Bug fix workflow  
- Documentation workflow
- Custom agent templates