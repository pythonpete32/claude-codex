# Testing Guide for Claude Codex

## 🎯 Core Principle
Write tests that verify **actual behavior**, not just coverage numbers. Test the things that can break in real usage.

## 📊 Testing Strategy Pyramid

```
        🔺 E2E Tests (15%)
       Real workflows, real files, real git
      Test complete user journeys
     
    🔷 Integration Tests (35%)
   Component interactions, real I/O
  Test boundaries between modules
 
🔶 Unit Tests (50%)
Pure functions, business logic
Test individual components
```

**Key Insight**: Our current 205 tests are mostly unit tests. We need more integration and E2E tests to catch real-world failures.
## ✅ Good vs ❌ Bad Patterns

### **Dependency Injection**

❌ **Bad: Hard to test**
```typescript
export async function createWorktree(taskId: string) {
  const result = await exec('git worktree add...'); // Can't control this
  return parseWorktreeInfo(result.stdout);
}
```

✅ **Good: Testable**
```typescript
export async function createWorktree(
  taskId: string,
  gitExecutor = defaultGitExecutor
) {
  const result = await gitExecutor.exec('git worktree add...');
  return parseWorktreeInfo(result.stdout);
}
```

### **Test Quality**

❌ **Bad: Meaningless coverage**
```typescript
it('should create worktree', async () => {
  const result = await createWorktree('test-id');
  expect(result).toBeDefined(); // Says nothing useful
});
```

✅ **Good: Tests real behavior**
```typescript
it('should handle branch name conflicts gracefully', async () => {
  const mockGit = vi.fn().mockRejectedValue(new Error('branch exists'));
  
  await expect(createWorktree('test-id', mockGit))
    .rejects.toThrow(WorktreeCreationError);
});
```

### **What to Mock (Unit Tests)**

✅ **Mock external systems:**
- Network calls (GitHub API, Claude SDK)
- Time-dependent operations (`Date.now()`)
- Resource-intensive operations

❌ **Don't mock your own business logic:**
- Your utility functions
- Your error classes
- Your data transformations

**Note**: For integration/E2E tests, see [Testing Strategy Guidelines](#-testing-strategy-guidelines) below for when to use real vs mocked dependencies.
### **Error Testing**

❌ **Bad: Only test happy path**
```typescript
it('should save task state', async () => {
  await saveTaskState(mockTask);
  expect(fs.writeFile).toHaveBeenCalled();
});
```

✅ **Good: Test failure scenarios**
```typescript
it('should handle file write permissions error', async () => {
  vi.mocked(fs.writeFile).mockRejectedValue(new Error('EACCES'));
  
  await expect(saveTaskState(mockTask))
    .rejects.toThrow(FileSystemError);
});
```

## 🎯 Testing Checklist

### **For each function, test:**
- [ ] Happy path with valid inputs
- [ ] Edge cases (empty strings, null, undefined)
- [ ] Error conditions (network failures, permission errors)
- [ ] Input validation (malformed data, wrong types)

### **For unit tests:**
- [ ] Mock external APIs and network calls
- [ ] Test error handling and edge cases
- [ ] Test business logic and validation
- [ ] Test pure functions and transformations

### **For integration tests:**
- [ ] Use real file operations and I/O
- [ ] Test component interactions
- [ ] Test configuration and flag combinations
- [ ] Test state persistence and management

### **For E2E tests:**
- [ ] Test complete user workflows
- [ ] Use minimal mocking (external services only)
- [ ] Test CLI command execution
- [ ] Test error propagation and recovery

## 🚀 Quick Start Pattern

```typescript
// Good test structure
describe('ComponentName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('happy path', () => {
    it('should do the main thing correctly', async () => {
      // Setup mocks for success case
      // Call function
      // Assert expected behavior
    });
  });

  describe('error handling', () => {
    it('should handle specific error gracefully', async () => {
      // Setup mocks for error case
      // Call function
      // Assert proper error thrown
    });
  });
});
```

## 🎨 Test Data Factories

```typescript
// Create reusable test data
export function createMockTaskState(overrides = {}): TaskState {
  return {
    taskId: 'test-123',
    specPath: './test-spec.md',
    originalSpec: 'Test spec content',
    // ... other defaults
    ...overrides
  };
}
```

## 🔍 Focus Areas

1. **Boundary conditions**: Empty arrays, null values, edge cases
2. **Error propagation**: External failures become meaningful app errors  
3. **Side effects**: Files created, commands executed, state changed
4. **Integration points**: Where components connect together

Remember: **Test behavior, not implementation**. If you refactor the code but behavior stays the same, tests shouldn't break.

---

## 🔗 Integration Testing Patterns

Integration tests verify that components work correctly when combined. They should use **real dependencies** for the components being tested.

### **Real File I/O Testing**
Use actual file operations to test state management and persistence.

✅ **Good: Test with real files**
```typescript
import { mkdtemp, rm, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('Task State Persistence', () => {
  let tempDir: string;
  
  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'codex-test-'));
    process.chdir(tempDir);
  });
  
  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });
  
  it('should persist agent responses to actual files', async () => {
    const taskId = 'test-task-123';
    
    // Initialize task state with real file operations
    const taskState = await initializeTaskState(taskId, 'test spec content', {
      maxIterations: 1
    });
    
    // Add agent response
    await addCoderResponse(taskId, 'I implemented the feature...');
    
    // Read actual file from disk
    const savedState = JSON.parse(
      await readFile(`.codex/task-${taskId}.json`, 'utf-8')
    );
    
    // Verify content persisted correctly
    expect(savedState.coderResponses[0]).toBe('I implemented the feature...');
    expect(savedState.coderResponses[0]).not.toBe(''); // Common bug!
  });
});
```

❌ **Bad: Mock file operations**
```typescript
// This won't catch file persistence bugs
vi.mock('node:fs/promises');
const mockWriteFile = vi.mocked(writeFile);

it('should save state', async () => {
  await saveTaskState(taskState);
  expect(mockWriteFile).toHaveBeenCalled(); // Doesn't verify actual persistence
});
```

### **Real Git Operations Testing**
Test git worktree operations with actual git repositories.

✅ **Good: Test with real git**
```typescript
describe('Worktree Operations', () => {
  let testRepo: string;
  
  beforeEach(async () => {
    testRepo = await mkdtemp(join(tmpdir(), 'git-test-'));
    process.chdir(testRepo);
    
    // Initialize real git repo
    await exec('git init');
    await exec('git config user.email "test@example.com"');
    await exec('git config user.name "Test User"');
    
    // Create initial commit
    await writeFile('README.md', '# Test Repo');
    await exec('git add README.md');
    await exec('git commit -m "Initial commit"');
  });
  
  afterEach(async () => {
    process.chdir('/'); // Exit before deletion
    await rm(testRepo, { recursive: true, force: true });
  });
  
  it('should create worktree with actual git commands', async () => {
    const taskId = 'test-task-456';
    
    const worktreeInfo = await createWorktree(taskId);
    
    // Verify worktree actually exists
    expect(worktreeInfo.path).toBeTruthy();
    expect(worktreeInfo.branchName).toBe(`tdd/${taskId}`);
    
    // Verify with real git commands
    const { stdout } = await exec('git worktree list');
    expect(stdout).toContain(worktreeInfo.path);
    expect(stdout).toContain(worktreeInfo.branchName);
  });
});
```

### **Component Integration Testing**
Test how multiple components work together.

✅ **Good: Test component boundaries**
```typescript
describe('State Management Integration', () => {
  it('should coordinate state updates across components', async () => {
    // Use real state management, mock only external services
    vi.mock('../core/claude.js', () => ({
      runAgent: vi.fn().mockResolvedValue({
        messages: [{ role: 'assistant', content: 'Real agent response' }]
      })
    }));
    
    const taskId = await generateTaskId();
    const initialState = await initializeTaskState(taskId, 'test spec', {});
    
    // Test the actual integration between components
    await addCoderResponse(taskId, 'Coder implementation...');
    await addReviewerResponse(taskId, 'Reviewer feedback...');
    
    const finalState = await getTaskState(taskId);
    
    // Verify integration worked correctly
    expect(finalState.coderResponses).toHaveLength(1);
    expect(finalState.reviewerResponses).toHaveLength(1);
    expect(finalState.currentIteration).toBe(1);
  });
});
```

### **Configuration and Flag Testing**
Test different configuration combinations and flag interactions.

✅ **Good: Test flag isolation**
```typescript
describe('Configuration Integration', () => {
  it('should behave identically regardless of verbose flag', async () => {
    const baseOptions = { specPath: './test-spec.md', maxReviews: 1, cleanup: false };
    
    // Mock external services only
    vi.mock('../core/claude.js');
    
    // Test without verbose
    const resultNormal = await executeTDDWorkflow(baseOptions);
    const stateNormal = await getTaskState(resultNormal.taskId);
    
    // Test with verbose
    const resultVerbose = await executeTDDWorkflow({ ...baseOptions, verbose: true });
    const stateVerbose = await getTaskState(resultVerbose.taskId);
    
    // Core behavior should be identical
    expect(stateNormal.coderResponses.length).toBe(stateVerbose.coderResponses.length);
    expect(stateNormal.status).toBe(stateVerbose.status);
    expect(stateNormal.currentIteration).toBe(stateVerbose.currentIteration);
  });
});
```

---

## 🚀 End-to-End Testing Patterns

E2E tests verify complete user workflows work correctly. They should use **minimal mocking** and test real user interactions.

### **Safe E2E Test Environment Setup**

```typescript
describe('TDD Workflow E2E', () => {
  let testWorkspace: string;
  let originalCwd: string;
  
  beforeEach(async () => {
    // Save original working directory
    originalCwd = process.cwd();
    
    // Create isolated test workspace
    testWorkspace = await mkdtemp(join(tmpdir(), 'e2e-test-'));
    process.chdir(testWorkspace);
    
    // Set up minimal git repository
    await exec('git init');
    await exec('git config user.email "test@example.com"');
    await exec('git config user.name "Test User"');
    await exec('git remote add origin https://github.com/test/repo.git');
    
    // Create test spec file
    await writeFile('test-spec.md', `
# Test Feature Implementation
Implement a simple test feature with proper error handling.
    `);
    
    // Initial commit
    await exec('git add .');
    await exec('git commit -m "Initial test setup"');
  });
  
  afterEach(async () => {
    // Return to original directory before cleanup
    process.chdir(originalCwd);
    await rm(testWorkspace, { recursive: true, force: true });
  });
});
```

### **Full Workflow E2E Testing**

✅ **Good: Test complete user journey**
```typescript
describe('Complete TDD Workflow', () => {
  it('should execute full workflow with real components', async () => {
    // Mock only external services
    vi.mock('../core/claude.js', () => ({
      runAgent: vi.fn()
        .mockResolvedValueOnce({
          messages: [{ role: 'assistant', content: 'I implemented the feature with tests...' }]
        })
        .mockResolvedValueOnce({
          messages: [{ role: 'assistant', content: 'Implementation looks good, creating PR...' }]
        })
    }));
    
    vi.mock('../core/operations/github.js', () => ({
      getGitHubConfig: vi.fn().mockResolvedValue({
        token: 'test-token',
        owner: 'test-owner', 
        repo: 'test-repo'
      }),
      checkPRExists: vi.fn()
        .mockResolvedValueOnce(null) // No PR first check
        .mockResolvedValue({ // PR exists after agent work
          number: 123,
          url: 'https://github.com/test-owner/test-repo/pull/123',
          state: 'open'
        })
    }));
    
    // Execute real workflow
    const result = await executeTDDWorkflow({
      specPath: './test-spec.md',
      maxReviews: 2,
      cleanup: false
    });
    
    // Verify successful completion
    expect(result.success).toBe(true);
    expect(result.prUrl).toBeTruthy();
    expect(result.iterations).toBe(1);
    
    // Verify real state persistence
    const taskState = await getTaskState(result.taskId);
    expect(taskState.coderResponses[0]).not.toBe('');
    expect(taskState.originalSpec).toContain('Test Feature Implementation');
    
    // Verify real worktree operations
    expect(taskState.worktreeInfo.path).toBeTruthy();
    expect(taskState.worktreeInfo.branchName).toMatch(/^tdd\//);
    
    // Verify cleanup was skipped (for debugging)
    const worktreePath = taskState.worktreeInfo.path;
    expect(await pathExists(worktreePath)).toBe(true);
  });
});
```

### **CLI E2E Testing**

✅ **Good: Test actual CLI invocation**
```typescript
describe('CLI End-to-End', () => {
  it('should handle real CLI invocation', async () => {
    // Set up environment
    process.env.GITHUB_TOKEN = 'test-token';
    
    // Mock only Claude SDK and GitHub API
    vi.mock('../core/claude.js');
    vi.mock('../core/operations/github.js');
    
    // Execute actual CLI command (via programmatic API)
    const result = await executeTDDWorkflow({
      specPath: './test-spec.md',
      maxReviews: 1,
      branchName: 'feature/test-branch',
      cleanup: true
    });
    
    // Verify CLI-level behavior
    expect(result.taskId).toMatch(/^task-\d+-[a-z0-9]+$/);
    expect(result.success).toBeDefined();
    
    // Verify environment validation passed
    // (This would catch environment detection bugs)
    
    // Verify cleanup happened (since cleanup: true)
    const taskState = await getTaskState(result.taskId).catch(() => null);
    expect(taskState).toBeNull(); // Should be cleaned up
  });
});
```

---

## 🛡️ Safe Testing Practices

### **Environment Isolation**
- Always use temporary directories for file operations
- Change to temp directory before tests, restore after
- Clean up all resources in `afterEach`
- Never test in the actual project directory

### **Git Repository Safety**
- Create fresh git repos for each test
- Use meaningless commit messages and author info
- Never push to real remotes
- Clean up git repositories completely

### **Environment Variable Management**
```typescript
describe('Environment Testing', () => {
  let originalEnv: NodeJS.ProcessEnv;
  
  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
  });
  
  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });
  
  it('should detect environment variables correctly', async () => {
    // Set test environment
    process.env.GITHUB_TOKEN = 'test-token-123';
    delete process.env.ANTHROPIC_API_KEY; // Test subscription mode
    
    const validation = await validateEnvironment();
    
    expect(validation.errors).not.toContain(
      expect.stringContaining('GITHUB_TOKEN')
    );
  });
});
```

### **Resource Cleanup Patterns**
```typescript
// Always clean up in reverse order of creation
afterEach(async () => {
  // 1. Change directory first
  if (originalCwd) {
    process.chdir(originalCwd);
  }
  
  // 2. Clean up files/directories
  if (tempDir) {
    await rm(tempDir, { recursive: true, force: true });
  }
  
  // 3. Restore environment
  if (originalEnv) {
    process.env = originalEnv;
  }
});
```

---

## 🎯 Testing Strategy Guidelines

### **When to Write Each Test Type**

#### **Unit Tests** ✅
- Pure functions and business logic
- Error handling and edge cases
- Algorithms and data transformations  
- Validation functions

#### **Integration Tests** ✅
- File I/O operations
- Database interactions
- Component boundaries
- State management
- Configuration handling

#### **E2E Tests** ✅
- Critical user workflows
- CLI command execution
- Multi-step processes
- Feature completeness

### **What to Mock vs What to Keep Real**

#### **Always Mock** 🚫
- External APIs (GitHub API, Claude API)
- Network requests
- Time-dependent operations (`Date.now()`)
- Resource-intensive operations

#### **Keep Real for Integration Tests** ✅
- File system operations
- Git operations
- Environment variable reading
- Process execution (for CLI testing)
- Internal component interactions

#### **Keep Real for E2E Tests** ✅
- Everything except external services
- File operations
- Git operations
- CLI argument parsing
- State management
- Error handling

---

## 🚨 Bug Reproduction Testing

When fixing bugs, always **write the failing test first**:

### **Bug Reproduction Pattern**
```typescript
describe('Bug Fix: Agent responses not saved', () => {
  it('reproduces the bug: agent responses are empty strings', async () => {
    // This test should FAIL before the bug is fixed
    
    // Set up real environment
    const tempDir = await mkdtemp(join(tmpdir(), 'bug-test-'));
    process.chdir(tempDir);
    
    try {
      // Mock Claude to return actual content
      vi.mocked(runAgent).mockResolvedValue({
        messages: [{ role: 'assistant', content: 'Real implementation...' }]
      });
      
      // Execute workflow
      const result = await executeTDDWorkflow({
        specPath: './test-spec.md',
        maxReviews: 1,
        cleanup: false
      });
      
      // Read actual task state from disk
      const taskState = JSON.parse(
        await readFile(`.codex/task-${result.taskId}.json`, 'utf-8')
      );
      
      // This assertion should FAIL, proving the bug exists
      expect(taskState.coderResponses[0]).not.toBe('');
      expect(taskState.coderResponses[0]).toContain('implementation');
      
    } finally {
      process.chdir('/');
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});
```

This ensures you **catch the bug before you fix it** - the essence of TDD.
>>>>>>> task4
