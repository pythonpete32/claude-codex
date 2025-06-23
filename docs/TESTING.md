# Testing Guide for Claude Codex

## 🎯 Core Principle
Write tests that verify **actual behavior**, not just coverage numbers. Test the things that can break in real usage.

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

### **What to Mock**

✅ **Mock external systems:**
- File system operations (`fs.readFile`, `fs.writeFile`)
- Network calls (GitHub API, Claude SDK)
- Shell commands (`git`, `gh`)
- Environment variables

❌ **Don't mock your own business logic:**
- Your utility functions
- Your error classes
- Your data transformations

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

### **For file operations:**
- [ ] Mock `fs/promises` module
- [ ] Test permission errors (`EACCES`, `ENOENT`)
- [ ] Test malformed JSON handling
- [ ] Test atomic operations (temp file + rename)

### **For network operations:**
- [ ] Mock HTTP requests
- [ ] Test different response codes (200, 404, 403, 500)
- [ ] Test network timeouts
- [ ] Test malformed response data

### **For shell commands:**
- [ ] Mock `child_process.exec`
- [ ] Test command construction
- [ ] Test non-zero exit codes
- [ ] Test stderr output handling

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