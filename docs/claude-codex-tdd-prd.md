# Claude Codex TDD Workflow - Product Requirements Document

## Overview

Claude Codex is an automation toolkit that orchestrates AI-driven development workflows. The TDD (Test-Driven Development) workflow is the first core feature, enabling two-agent collaboration for implementing specifications with automated testing, code review, and pull request creation.

## Vision

Enable developers to run `npx claude-codex tdd ./spec.md` and get a fully implemented, tested, and reviewed feature with an automatic pull request - all through AI agent collaboration.

## Core Workflow

### High-Level Flow
1. **Setup**: Create isolated worktree + branch for the task
2. **Implementation**: Coder Agent reads spec → writes tests → implements code
3. **Review Loop**: Reviewer Agent validates work → either creates PR or provides feedback
4. **Iteration**: If feedback provided, pass to Coder Agent (max 3 attempts)
5. **Detection**: Monitor for PR creation as success indicator
6. **Cleanup**: Handle completion or failure scenarios

### Agent Communication Model
- **State Management**: File-based task state with structured handoffs between agents
- **Context Transfer**: Coder Agent provides structured summary, Reviewer gets full context
- **Intelligence-Driven**: Agents analyze codebase structure and adapt to project specifics
- **Isolation**: Each task runs in its own worktree to prevent conflicts

## Functional Requirements

### CLI Interface
```bash
npx claude-codex tdd <spec-file-path> [options]

Options:
--reviews <number>    Maximum review iterations (default: 3)
--branch <name>       Custom branch name (default: auto-generated)
--cleanup <boolean>   Auto-cleanup on failure (default: true)
```

### Input Specifications
- **Format**: Markdown files containing feature specifications
- **Location**: User-provided file path (leverages Claude's file reading capabilities)
- **Content**: Natural language requirements, acceptance criteria, examples

### Agent Prompts

#### Coder Agent Prompt Template
```
[INITIAL RUN]
Implement the specification in the provided file using Test-Driven Development:
1. Read and understand the requirements
2. Write comprehensive tests first
3. Implement the minimal code to pass tests
4. Refactor for quality and clarity

[REVISION RUN] 
Address this review feedback: {reviewer_feedback}
Update tests and implementation as needed.

Always end your response with this structured handoff:

## Implementation Summary
- **What I Built**: [brief description of the feature]
- **Files Modified**: [list of files created/modified]
- **Testing Instructions**: [specific commands to validate the work]
- **Manual Validation**: [any manual steps needed to verify functionality]
- **Notes for Reviewer**: [important context, design decisions, caveats]
```

#### Reviewer Agent Prompt Template
```
You are a Senior Engineer conducting a thorough code review.

ORIGINAL SPECIFICATION: {originalSpec}
CODER'S HANDOFF: {coderSummary}
ITERATION: {currentIteration} of {maxIterations}

REVIEW PROCESS:
1. **Deep Analysis**: First, analyze this codebase structure, testing framework, and available tooling
2. **Follow Instructions**: Execute the testing instructions provided by the coder exactly
3. **Intelligent Validation**: Use your codebase analysis to run additional appropriate quality checks
4. **Specification Compliance**: Verify the implementation meets the original requirements
5. **Production Readiness**: Assess code quality, error handling, and maintainability

OUTCOMES:
- If production-ready: Create a pull request with comprehensive title and description
- If changes needed: Provide specific, actionable feedback referencing the original specification

Leverage your intelligence to adapt to any project structure (React, Node, Python, etc.) based on your analysis.
```

## Technical Architecture

### Core Components

#### WorktreeManager
```typescript
interface WorktreeManager {
  createWorktree(taskId: string, baseBranch?: string): Promise<WorktreeInfo>
  cleanup(worktreeInfo: WorktreeInfo): Promise<void>
  getCurrentBranch(): Promise<string>
}

interface WorktreeInfo {
  path: string
  branchName: string
  taskId: string
}
```

#### AgentOrchestrator
```typescript
interface AgentOrchestrator {
  runCoderAgent(specPath: string, feedback?: string): Promise<AgentResult>
  runReviewerAgent(coderSummary: string): Promise<AgentResult>
  extractFinalMessage(result: AgentResult): string
}

interface AgentResult {
  messages: SDKMessage[]
  finalMessage: string
  success: boolean
}
```

#### PRDetector
```typescript
interface PRDetector {
  checkPRExists(branchName: string): Promise<boolean>
  waitForPR(branchName: string, timeoutMs: number): Promise<boolean>
  getPRDetails(branchName: string): Promise<PRInfo | null>
}

interface PRInfo {
  number: number
  title: string
  url: string
}
```

#### StateManager
```typescript
interface StateManager {
  initializeTask(specPath: string, taskId: string): Promise<TaskState>
  updateTask(taskState: TaskState): Promise<void>
  getTaskState(taskId: string): Promise<TaskState>
  cleanup(taskId: string): Promise<void>
}

interface TaskState {
  taskId: string
  originalSpec: string
  currentIteration: number
  coderOutputs: string[]     // Structured handoffs from coder
  reviewerFeedbacks: string[] // Feedback from reviewer
  createdAt: string
  worktreeInfo: WorktreeInfo
}
```

#### TDDWorkflow (Main Orchestrator)
```typescript
interface TDDWorkflow {
  execute(options: TDDOptions): Promise<TDDResult>
}

interface TDDOptions {
  specPath: string
  maxReviews: number
  branchName?: string
  cleanup: boolean
}

interface TDDResult {
  success: boolean
  prInfo?: PRInfo
  iterations: number
  error?: string
}
```

## Implementation Phases

### Phase 1: Foundation (MVP Core)
1. **CLI Setup**: Extend existing args parser for TDD command
2. **Worktree Management**: Git worktree creation and cleanup
3. **State Management**: Simple file-based task state (.claude-codex/task-state.json)
4. **Structured Agent Communication**: Coder provides handoff template, Reviewer gets full context
5. **Intelligence-Driven Review**: Reviewer analyzes codebase and adapts to project structure
6. **PR Detection**: GitHub CLI integration for PR checking
7. **Execution Logging**: Basic operation logging for debugging

### Phase 2: Robustness  
1. **Error Handling**: Comprehensive failure scenarios and recovery
2. **Validation**: Pre-flight checks (GitHub CLI, auth, repo state)
3. **Enhanced Logging**: Detailed operation tracking and debugging info
4. **Cleanup**: Automatic worktree cleanup on completion/failure
5. **Template Validation**: Ensure coder follows handoff template structure

### Phase 3: Enhancement
1. **Progress Indicators**: Real-time status updates during agent execution
2. **Configurable Prompts**: User-customizable agent prompts and templates
3. **Multiple Spec Formats**: Support for various input formats beyond markdown
4. **Advanced Analytics**: Code quality metrics and review insights
5. **Multi-Framework Intelligence**: Enhanced adaptation to different tech stacks

## Success Criteria

### Definition of Done
- [ ] CLI command `npx claude-codex tdd spec.md` works end-to-end
- [ ] Package published to NPM and JSR
- [ ] Successful TDD workflow demonstration
- [ ] Clean failure handling and error messages
- [ ] Documentation and usage examples

### Success Metrics
- **Reliability**: 80%+ success rate on well-defined specifications
- **Performance**: Complete workflow in under 10 minutes for medium features
- **Usability**: Zero configuration required (assumes GitHub CLI setup)
- **Quality**: Generated code passes basic quality checks

## Assumptions and Dependencies

### Technical Assumptions
- Users have GitHub CLI installed and authenticated
- Users run from within a Git repository
- Claude Code SDK has necessary permissions for file operations
- Repository has appropriate branch protection settings

### Dependencies
- Claude Code SDK (existing)
- GitHub CLI (`gh` command)
- Git worktree support
- Node.js 18+ environment

## Risk Mitigation

### High-Risk Areas
1. **Agent Reliability**: Claude may not follow prompt instructions exactly
   - *Mitigation*: Robust parsing and fallback mechanisms
   
2. **GitHub Integration**: API rate limits or authentication issues
   - *Mitigation*: Proper error handling and user guidance
   
3. **Worktree Conflicts**: Multiple simultaneous executions
   - *Mitigation*: Unique worktree naming and cleanup procedures

4. **Prompt Engineering**: Agents may behave unpredictably
   - *Mitigation*: Iterative prompt refinement and testing

### Failure Scenarios
- **Spec File Not Found**: Clear error message and usage guidance
- **No GitHub CLI**: Fail fast with installation instructions
- **PR Creation Failed**: Detailed error reporting and manual fallback
- **Max Iterations Reached**: Summary report and partial work preservation

## Future Considerations

### Potential Extensions
- Multiple reviewer agents (security, performance, accessibility)
- Integration with CI/CD pipelines
- Specification template generation
- Code style and convention enforcement
- Automated testing beyond unit tests

### Scalability Considerations
- Agent pool management for concurrent tasks
- Cost optimization for Claude API usage
- Enterprise authentication and permissions
- Team collaboration features

## Validation Plan

### Testing Strategy
1. **Unit Tests**: Individual component functionality
2. **Integration Tests**: End-to-end workflow validation
3. **Real-world Testing**: Use on actual feature specifications
4. **Edge Case Testing**: Failure scenarios and error conditions

### Success Validation
- Implement 3-5 diverse feature specifications
- Verify generated PRs meet quality standards
- Confirm cleanup procedures work correctly
- Validate user experience and error messaging