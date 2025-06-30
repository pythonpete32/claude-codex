# Architecture Clarifications & Updates

## 1. Session Domain Model Clarification

**Question**: Are messages and tool interactions raw log entries or chat items?

**Answer**: The Session entity stores references to both:
- **Raw LogEntries** are stored in the JSONL files (source of truth)
- **ChatItems** are the transformed, UI-ready representations

```typescript
// Updated Session model
export class Session {
  constructor(
    public readonly id: string,
    public readonly projectPath: string,
    public readonly githubRepo?: string,      // NEW: GitHub tracking
    private _isActive: boolean,
    private _lastActivity: Date,
    private _messageCount: number
  ) {}
  
  // Session doesn't store messages directly
  // Messages are fetched from JSONL files when needed
}

// Data flow clarification
interface DataFlow {
  source: "JSONL files contain raw LogEntry objects";
  processing: "CorrelationEngine processes LogEntry → ChatItem";
  storage: "Session entity tracks metadata only";
  display: "UI components consume ChatItem objects";
}
```

## 2. UI Components Location

**Decision**: Keep UI components within the web app, not separate package.

```
Updated structure:
claude-ui/
├── apps/
│   ├── web/
│   │   ├── app/
│   │   ├── components/
│   │   │   ├── chat-items/     # All 14 chat item components HERE
│   │   │   │   ├── bash-tool.tsx
│   │   │   │   ├── edit-tool.tsx
│   │   │   │   └── ... etc
│   │   │   └── layout/
│   │   └── lib/
│   └── api/
├── packages/
│   ├── core/                   # Domain models only
│   └── log-processor/          # Processing logic only
└── shared/
    └── types/                  # Shared types
```

## 3. GitHub Repository Tracking

```typescript
// Enhanced Project model
export class Project {
  constructor(
    public readonly path: string,
    public readonly encodedPath: string,
    public readonly githubRepo?: GitHubRepo,  // NEW
    private sessions: Map<string, Session> = new Map()
  ) {}
  
  static detectGitHubRepo(projectPath: string): GitHubRepo | undefined {
    // Check for .git/config and extract remote origin
    const gitConfig = await fs.readFile(`${projectPath}/.git/config`);
    const match = gitConfig.match(/url = git@github\.com:(.+)\.git/);
    
    if (match) {
      const [owner, repo] = match[1].split('/');
      return { owner, repo, url: `https://github.com/${match[1]}` };
    }
    return undefined;
  }
}

interface GitHubRepo {
  owner: string;
  repo: string;
  url: string;
}
```

## 4. Project Path Encoding Solution

**Problem**: Current encoding loses information when project names contain dashes.

**Solution**: Use base64url encoding or a reversible escape mechanism:

```typescript
// Option 1: Base64URL encoding (guaranteed reversible)
export class ProjectPath {
  toEncoded(): string {
    // Convert to base64url (URL-safe, no padding)
    return Buffer.from(this.originalPath)
      .toString('base64url');
  }
  
  static fromEncoded(encoded: string): ProjectPath {
    const original = Buffer.from(encoded, 'base64url')
      .toString('utf-8');
    return new ProjectPath(original);
  }
}

// Option 2: Escape sequence approach
export class ProjectPath {
  toEncoded(): string {
    // Escape dashes first, then apply encoding
    return this.originalPath
      .replace(/-/g, '~dash~')     // Escape existing dashes
      .replace(/\./g, '~dot~')     // Escape dots
      .replace(/\//g, '-');        // Now safe to use dash for slash
  }
  
  static fromEncoded(encoded: string): ProjectPath {
    const original = encoded
      .replace(/-/g, '/')          // Restore slashes
      .replace(/~dot~/g, '.')      // Restore dots
      .replace(/~dash~/g, '-');    // Restore original dashes
    return new ProjectPath(original);
  }
}

// Option 3: Use URL encoding
export class ProjectPath {
  toEncoded(): string {
    return encodeURIComponent(this.originalPath);
  }
  
  static fromEncoded(encoded: string): ProjectPath {
    return new ProjectPath(decodeURIComponent(encoded));
  }
}
```

## 5. Repository Pattern Clarification

**SessionRepository** is a design pattern interface, NOT a GitHub repository.

```typescript
// This is the Repository Pattern from Domain-Driven Design
export interface SessionRepository {
  // Methods to fetch Session entities from data storage
  findById(id: string): Promise<Session | null>;
  findByProject(projectPath: string): Promise<Session[]>;
  findActive(): Promise<Session[]>;
}

// Implementation reads from file system
export class FileSessionRepository implements SessionRepository {
  async findById(id: string): Promise<Session | null> {
    // Read from ~/.claude/projects/*/[id].jsonl
  }
}

// Future: Could have different implementations
export class ClaudeSDKRepository implements SessionRepository {
  async findById(id: string): Promise<Session | null> {
    // Fetch from Claude SDK instead of files
  }
}
```

## 6. Using Biome Instead of ESLint/Prettier

```json
// biome.json
{
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "complexity": {
        "noExcessiveCognitiveComplexity": "error"
      }
    }
  },
  "formatter": {
    "enabled": true,
    "formatWithErrors": false,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  }
}

// package.json scripts
{
  "scripts": {
    "lint": "biome check .",
    "lint:fix": "biome check --apply .",
    "format": "biome format --write ."
  }
}
```

## 7. Comprehensive Testing Strategy

### **What to Test & How**

#### **Unit Tests: Domain Logic**

```typescript
// Session entity tests
describe('Session', () => {
  describe('activity tracking', () => {
    it('should be active when last activity is within 60 seconds', () => {
      // GIVEN: A session with recent activity
      const session = new Session(
        'test-id',
        '/test/project',
        true,
        new Date(),
        10
      );
      
      // WHEN: We check if it's active
      const isActive = session.isActive;
      
      // THEN: It should be active
      expect(isActive).toBe(true);
    });
    
    it('should be inactive when last activity is older than 60 seconds', () => {
      // GIVEN: A session with old activity
      const oldDate = new Date(Date.now() - 61000);
      const session = new Session(
        'test-id',
        '/test/project',
        false,
        oldDate,
        10
      );
      
      // WHEN: We check if it's active
      const isActive = session.isActive;
      
      // THEN: It should be inactive
      expect(isActive).toBe(false);
    });
  });
});

// Stubs needed:
// - None, pure domain logic
```

#### **Unit Tests: Parsers**

```typescript
// Bash tool parser tests
describe('BashToolParser', () => {
  const parser = new BashToolParser();
  
  describe('parsing tool calls', () => {
    it('should parse bash command input correctly', () => {
      // GIVEN: A log entry with bash tool use
      const logEntry: LogEntry = {
        uuid: 'test-123',
        timestamp: '2024-01-01T00:00:00Z',
        type: 'assistant',
        content: [{
          type: 'tool_use',
          id: 'tool-456',
          name: 'bash',
          input: {
            command: 'ls -la',
            description: 'List files'
          }
        }]
      };
      
      // WHEN: We parse it
      const chatItem = parser.parse(logEntry);
      
      // THEN: It should extract command correctly
      expect(chatItem.type).toBe('bash_tool');
      expect(chatItem.content.command).toBe('ls -la');
      expect(chatItem.content.status).toBe('pending');
    });
    
    it('should parse bash results with error correctly', () => {
      // GIVEN: Tool call and error result
      const callEntry = createBashCallEntry('rm /protected');
      const resultEntry: LogEntry = {
        uuid: 'test-789',
        timestamp: '2024-01-01T00:00:01Z',
        type: 'assistant',
        content: [{
          type: 'tool_result',
          tool_use_id: 'tool-456',
          is_error: true,
          output: 'Permission denied'
        }]
      };
      
      // WHEN: We parse with result
      const chatItem = parser.parse(callEntry, resultEntry);
      
      // THEN: It should show failed status
      expect(chatItem.content.status).toBe('failed');
      expect(chatItem.content.output.stderr).toBe('Permission denied');
    });
  });
});

// Stubs needed:
// - createBashCallEntry() helper
// - Mock LogEntry objects
```

#### **Integration Tests: Repository**

```typescript
// File repository tests
describe('FileSessionRepository', () => {
  let repository: FileSessionRepository;
  let mockFileSystem: MockFileSystem;
  
  beforeEach(() => {
    mockFileSystem = new MockFileSystem();
    repository = new FileSessionRepository(mockFileSystem);
  });
  
  describe('findById', () => {
    it('should return session when JSONL file exists', async () => {
      // GIVEN: A JSONL file exists
      mockFileSystem.addFile(
        '/home/user/.claude/projects/my-project/abc-123.jsonl',
        `{"uuid":"msg1","type":"user","content":"Hello"}\n` +
        `{"uuid":"msg2","type":"assistant","content":"Hi there"}`
      );
      
      // WHEN: We find by ID
      const session = await repository.findById('abc-123');
      
      // THEN: Session should be loaded
      expect(session).toBeDefined();
      expect(session.id).toBe('abc-123');
      expect(session.messageCount).toBe(2);
    });
    
    it('should return null when file does not exist', async () => {
      // GIVEN: No file exists
      
      // WHEN: We find by ID
      const session = await repository.findById('not-found');
      
      // THEN: Should return null
      expect(session).toBeNull();
    });
  });
});

// Stubs needed:
class MockFileSystem {
  private files = new Map<string, string>();
  
  addFile(path: string, content: string) {
    this.files.set(path, content);
  }
  
  async readFile(path: string): Promise<string> {
    const content = this.files.get(path);
    if (!content) throw new Error('File not found');
    return content;
  }
  
  async exists(path: string): Promise<boolean> {
    return this.files.has(path);
  }
}
```

#### **Integration Tests: Correlation Engine**

```typescript
describe('CorrelationEngine', () => {
  let engine: CorrelationEngine;
  let mockEventEmitter: MockEventEmitter;
  
  beforeEach(() => {
    mockEventEmitter = new MockEventEmitter();
    engine = new CorrelationEngine(
      new ParserRegistry(),
      mockEventEmitter
    );
  });
  
  it('should correlate tool call with result', async () => {
    // GIVEN: A tool call followed by result
    const callEntry = createToolCallEntry('bash', 'ls -la');
    const resultEntry = createToolResultEntry(callEntry.content.id, 'file1\nfile2');
    
    // WHEN: We process both entries
    await engine.processLogEntry(callEntry);
    const chatItem = await engine.processLogEntry(resultEntry);
    
    // THEN: Should emit completion event
    expect(mockEventEmitter.emitted).toContainEqual({
      event: 'tool.completed',
      data: expect.objectContaining({
        toolName: 'bash',
        success: true
      })
    });
    
    // AND: Chat item should be complete
    expect(chatItem.content.status).toBe('completed');
  });
  
  it('should handle timeout for uncorrelated calls', async () => {
    jest.useFakeTimers();
    
    // GIVEN: A tool call with no result
    const callEntry = createToolCallEntry('bash', 'sleep 999');
    
    // WHEN: We process call and wait for timeout
    await engine.processLogEntry(callEntry);
    jest.advanceTimersByTime(5 * 60 * 1000); // 5 minutes
    
    // THEN: Should emit timeout event
    expect(mockEventEmitter.emitted).toContainEqual({
      event: 'tool.timeout',
      data: expect.objectContaining({
        toolName: 'bash'
      })
    });
  });
});

// Stubs needed:
class MockEventEmitter {
  emitted: Array<{event: string, data: any}> = [];
  
  emit(event: string, data: any) {
    this.emitted.push({event, data});
  }
}
```

#### **E2E Tests: API Endpoints**

```typescript
describe('Sessions API', () => {
  let app: TestApp;
  
  beforeAll(async () => {
    app = await createTestApp({
      mockFileSystem: true,
      mockData: testSessions
    });
  });
  
  describe('GET /api/sessions', () => {
    it('should return active sessions when filtered', async () => {
      // GIVEN: Test data with mixed sessions
      
      // WHEN: We request active sessions
      const response = await app.request()
        .get('/api/sessions?active=true')
        .expect(200);
      
      // THEN: Should only return active ones
      expect(response.body.sessions).toHaveLength(2);
      expect(response.body.sessions.every(s => s.isActive)).toBe(true);
    });
  });
  
  describe('WebSocket /api/sessions/:id/stream', () => {
    it('should stream new log entries', async () => {
      // GIVEN: A WebSocket connection
      const ws = new WebSocket('ws://localhost:3001/api/sessions/test-123/stream');
      const messages: any[] = [];
      
      ws.onmessage = (event) => {
        messages.push(JSON.parse(event.data));
      };
      
      // WHEN: New log entry is added
      await app.mockFileSystem.appendToFile(
        'test-123.jsonl',
        '{"type":"user","content":"New message"}\n'
      );
      
      // THEN: Should receive update
      await waitFor(() => {
        expect(messages).toHaveLength(1);
        expect(messages[0].type).toBe('user_message');
      });
    });
  });
});

// Test utilities:
async function createTestApp(config: TestConfig) {
  // Create Elysia app with mocked services
}

async function waitFor(condition: () => void, timeout = 1000) {
  // Poll until condition is met
}
```

### **Test Coverage Goals**

| Component | Target Coverage | Priority |
|-----------|----------------|----------|
| Domain Models | 100% | High |
| Parsers | 95% | High |
| Correlation Engine | 90% | High |
| Repositories | 85% | Medium |
| API Endpoints | 80% | Medium |
| React Components | 70% | Low |

### **Key Testing Principles**

1. **Test behavior, not implementation**
2. **Use real data shapes from fixtures**
3. **Mock at service boundaries, not internally**
4. **Each test should be independent**
5. **Test names should be business-readable**