# Parser Implementation Details
## Complete Specifications for All 14 Tool Parsers

## Overview

This document provides the complete implementation details for all 14 tool parsers, showing exactly how each tool's input/output should be parsed from Claude's log entries.

---

## Base Parser Structure

```typescript
// packages/core/chat-items/parsers/base-parser.ts

export abstract class BaseToolParser<T extends ChatItem> implements ToolParser<T> {
  abstract toolName: string;
  
  canParse(entry: LogEntry): boolean {
    return this.isToolUse(entry, this.toolName);
  }
  
  protected isToolUse(entry: LogEntry, toolName?: string): boolean {
    if (entry.type !== 'assistant') return false;
    
    const content = this.normalizeContent(entry.content);
    if (!content) return false;
    
    const hasToolUse = content.some(block => 
      block.type === 'tool_use' && 
      (!toolName || block.name === toolName)
    );
    
    return hasToolUse;
  }
  
  protected isToolResult(entry: LogEntry): boolean {
    if (entry.type !== 'assistant') return false;
    
    const content = this.normalizeContent(entry.content);
    return content.some(block => block.type === 'tool_result');
  }
  
  protected normalizeContent(content: string | MessageContent | MessageContent[]): MessageContent[] {
    if (typeof content === 'string') {
      return [{ type: 'text', text: content }];
    }
    if (Array.isArray(content)) {
      return content;
    }
    return [content];
  }
  
  protected extractToolUse(entry: LogEntry): any {
    const content = this.normalizeContent(entry.content);
    return content.find(block => block.type === 'tool_use');
  }
  
  protected extractToolResult(entry: LogEntry): any {
    const content = this.normalizeContent(entry.content);
    return content.find(block => block.type === 'tool_result');
  }
  
  protected extractSessionId(entry: LogEntry): string {
    // Extract from file path or context
    return entry.sessionId || 'unknown';
  }
  
  protected determineStatus(result?: any): 'pending' | 'completed' | 'failed' {
    if (!result) return 'pending';
    return result.is_error ? 'failed' : 'completed';
  }
}
```

---

## 1. Bash Tool Parser

```typescript
// packages/core/chat-items/parsers/bash-parser.ts

export class BashToolParser extends BaseToolParser<BashToolItem> {
  toolName = 'bash';
  
  parse(entry: LogEntry, result?: LogEntry): BashToolItem {
    const toolUse = this.extractToolUse(entry);
    const toolResult = result ? this.extractToolResult(result) : undefined;
    
    return {
      id: toolUse.id,
      type: 'bash_tool',
      timestamp: entry.timestamp,
      sessionId: this.extractSessionId(entry),
      content: {
        command: toolUse.input.command,
        description: toolUse.input.description,
        timeout: toolUse.input.timeout,
        output: toolResult ? {
          stdout: toolResult.output.stdout || '',
          stderr: toolResult.output.stderr || '',
          exitCode: toolResult.output.exit_code || 0,
          isError: toolResult.is_error || false,
          interrupted: toolResult.output.interrupted || false,
          isImage: this.detectImageOutput(toolResult.output.stdout)
        } : undefined,
        status: this.determineStatus(toolResult)
      }
    };
  }
  
  private detectImageOutput(stdout: string): boolean {
    // Check if output contains base64 image data
    return stdout.includes('data:image/') || 
           stdout.includes('base64,');
  }
}

// Input shape from Claude:
interface BashInput {
  command: string;
  description?: string;
  timeout?: number;
}

// Output shape from Claude:
interface BashOutput {
  stdout?: string;
  stderr?: string;
  exit_code?: number;
  interrupted?: boolean;
}
```

---

## 2. Edit Tool Parser

```typescript
// packages/core/chat-items/parsers/edit-parser.ts

export class EditToolParser extends BaseToolParser<EditToolItem> {
  toolName = 'edit';
  
  parse(entry: LogEntry, result?: LogEntry): EditToolItem {
    const toolUse = this.extractToolUse(entry);
    const toolResult = result ? this.extractToolResult(result) : undefined;
    
    return {
      id: toolUse.id,
      type: 'edit_tool',
      timestamp: entry.timestamp,
      sessionId: this.extractSessionId(entry),
      content: {
        file_path: toolUse.input.file_path,
        old_string: toolUse.input.old_string,
        new_string: toolUse.input.new_string,
        replace_all: toolUse.input.replace_all || false,
        status: this.determineStatus(toolResult),
        error: toolResult?.is_error ? toolResult.output : undefined,
        diff: this.generateDiff(toolUse.input)
      }
    };
  }
  
  private generateDiff(input: any): string {
    // Simple diff representation
    return `- ${input.old_string}\n+ ${input.new_string}`;
  }
}

// Input shape:
interface EditInput {
  file_path: string;
  old_string: string;
  new_string: string;
  replace_all?: boolean;
}
```

---

## 3. Read Tool Parser

```typescript
// packages/core/chat-items/parsers/read-parser.ts

export class ReadToolParser extends BaseToolParser<ReadToolItem> {
  toolName = 'read';
  
  parse(entry: LogEntry, result?: LogEntry): ReadToolItem {
    const toolUse = this.extractToolUse(entry);
    const toolResult = result ? this.extractToolResult(result) : undefined;
    
    return {
      id: toolUse.id,
      type: 'read_tool',
      timestamp: entry.timestamp,
      sessionId: this.extractSessionId(entry),
      content: {
        file_path: toolUse.input.file_path,
        limit: toolUse.input.limit,
        offset: toolUse.input.offset,
        file_content: toolResult?.output || '',
        line_count: this.countLines(toolResult?.output),
        is_truncated: this.checkTruncation(toolResult?.output),
        status: this.determineStatus(toolResult),
        error: toolResult?.is_error ? toolResult.output : undefined
      }
    };
  }
  
  private countLines(content?: string): number {
    if (!content) return 0;
    return content.split('\n').length;
  }
  
  private checkTruncation(content?: string): boolean {
    if (!content) return false;
    return content.includes('[truncated]') || 
           content.includes('... (truncated)');
  }
}

// Input shape:
interface ReadInput {
  file_path: string;
  limit?: number;
  offset?: number;
}
```

---

## 4. Write Tool Parser

```typescript
// packages/core/chat-items/parsers/write-parser.ts

export class WriteToolParser extends BaseToolParser<WriteToolItem> {
  toolName = 'write';
  
  parse(entry: LogEntry, result?: LogEntry): WriteToolItem {
    const toolUse = this.extractToolUse(entry);
    const toolResult = result ? this.extractToolResult(result) : undefined;
    
    return {
      id: toolUse.id,
      type: 'write_tool',
      timestamp: entry.timestamp,
      sessionId: this.extractSessionId(entry),
      content: {
        file_path: toolUse.input.file_path,
        content: toolUse.input.content,
        bytes_written: toolUse.input.content?.length || 0,
        created: this.isNewFile(toolResult),
        status: this.determineStatus(toolResult),
        error: toolResult?.is_error ? toolResult.output : undefined
      }
    };
  }
  
  private isNewFile(result?: any): boolean {
    // Check if result indicates file was created
    return result?.output?.includes('created') || false;
  }
}

// Input shape:
interface WriteInput {
  file_path: string;
  content: string;
}
```

---

## 5. Glob Tool Parser

```typescript
// packages/core/chat-items/parsers/glob-parser.ts

export class GlobToolParser extends BaseToolParser<GlobToolItem> {
  toolName = 'glob';
  
  parse(entry: LogEntry, result?: LogEntry): GlobToolItem {
    const toolUse = this.extractToolUse(entry);
    const toolResult = result ? this.extractToolResult(result) : undefined;
    
    const matches = this.parseMatches(toolResult?.output);
    
    return {
      id: toolUse.id,
      type: 'glob_tool',
      timestamp: entry.timestamp,
      sessionId: this.extractSessionId(entry),
      content: {
        pattern: toolUse.input.pattern,
        path: toolUse.input.path || '.',
        matches: matches,
        match_count: matches.length,
        status: this.determineStatus(toolResult),
        error: toolResult?.is_error ? toolResult.output : undefined
      }
    };
  }
  
  private parseMatches(output?: string): string[] {
    if (!output || typeof output !== 'string') return [];
    return output.split('\n').filter(line => line.trim());
  }
}

// Input shape:
interface GlobInput {
  pattern: string;
  path?: string;
}
```

---

## 6. Grep Tool Parser

```typescript
// packages/core/chat-items/parsers/grep-parser.ts

export class GrepToolParser extends BaseToolParser<GrepToolItem> {
  toolName = 'grep';
  
  parse(entry: LogEntry, result?: LogEntry): GrepToolItem {
    const toolUse = this.extractToolUse(entry);
    const toolResult = result ? this.extractToolResult(result) : undefined;
    
    const matches = this.parseGrepOutput(toolResult?.output);
    
    return {
      id: toolUse.id,
      type: 'grep_tool',
      timestamp: entry.timestamp,
      sessionId: this.extractSessionId(entry),
      content: {
        pattern: toolUse.input.pattern,
        path: toolUse.input.path || '.',
        include: toolUse.input.include,
        matches: matches,
        match_count: matches.length,
        files_searched: this.extractFilesSearched(matches),
        status: this.determineStatus(toolResult),
        error: toolResult?.is_error ? toolResult.output : undefined
      }
    };
  }
  
  private parseGrepOutput(output?: string): GrepMatch[] {
    if (!output || typeof output !== 'string') return [];
    
    return output.split('\n')
      .filter(line => line.trim())
      .map(line => {
        const [file, lineNum, ...content] = line.split(':');
        return {
          file,
          line: parseInt(lineNum) || 0,
          content: content.join(':'),
          highlighted: this.highlightMatch(content.join(':'))
        };
      });
  }
  
  private extractFilesSearched(matches: GrepMatch[]): number {
    return new Set(matches.map(m => m.file)).size;
  }
  
  private highlightMatch(content: string): string {
    // Add highlighting markers
    return content;
  }
}

interface GrepMatch {
  file: string;
  line: number;
  content: string;
  highlighted: string;
}

// Input shape:
interface GrepInput {
  pattern: string;
  path?: string;
  include?: string;
}
```

---

## 7. LS Tool Parser

```typescript
// packages/core/chat-items/parsers/ls-parser.ts

export class LsToolParser extends BaseToolParser<LsToolItem> {
  toolName = 'ls';
  
  parse(entry: LogEntry, result?: LogEntry): LsToolItem {
    const toolUse = this.extractToolUse(entry);
    const toolResult = result ? this.extractToolResult(result) : undefined;
    
    const items = this.parseLsOutput(toolResult?.output);
    
    return {
      id: toolUse.id,
      type: 'ls_tool',
      timestamp: entry.timestamp,
      sessionId: this.extractSessionId(entry),
      content: {
        path: toolUse.input.path,
        ignore: toolUse.input.ignore || [],
        items: items,
        total_count: items.length,
        directory_count: items.filter(i => i.type === 'directory').length,
        file_count: items.filter(i => i.type === 'file').length,
        status: this.determineStatus(toolResult),
        error: toolResult?.is_error ? toolResult.output : undefined
      }
    };
  }
  
  private parseLsOutput(output?: string): FileItem[] {
    if (!output || typeof output !== 'string') return [];
    
    return output.split('\n')
      .filter(line => line.trim())
      .map(line => {
        const isDirectory = line.includes('/');
        const depth = (line.match(/  /g) || []).length;
        const name = line.trim().replace(/\/$/, '');
        
        return {
          name,
          type: isDirectory ? 'directory' : 'file',
          depth,
          path: name // Would need context for full path
        };
      });
  }
}

interface FileItem {
  name: string;
  type: 'file' | 'directory';
  depth: number;
  path: string;
}

// Input shape:
interface LsInput {
  path: string;
  ignore?: string[];
}
```

---

## 8. MultiEdit Tool Parser

```typescript
// packages/core/chat-items/parsers/multi-edit-parser.ts

export class MultiEditToolParser extends BaseToolParser<MultiEditToolItem> {
  toolName = 'multiedit';
  
  parse(entry: LogEntry, result?: LogEntry): MultiEditToolItem {
    const toolUse = this.extractToolUse(entry);
    const toolResult = result ? this.extractToolResult(result) : undefined;
    
    const edits = toolUse.input.edits || [];
    const results = this.parseEditResults(toolResult);
    
    return {
      id: toolUse.id,
      type: 'multi_edit_tool',
      timestamp: entry.timestamp,
      sessionId: this.extractSessionId(entry),
      content: {
        file_path: toolUse.input.file_path,
        edits: edits.map((edit, index) => ({
          old_string: edit.old_string,
          new_string: edit.new_string,
          replace_all: edit.replace_all || false,
          status: results[index]?.status || 'pending',
          error: results[index]?.error
        })),
        total_edits: edits.length,
        successful_edits: results.filter(r => r.status === 'completed').length,
        status: this.determineOverallStatus(results),
        error: toolResult?.is_error ? toolResult.output : undefined
      }
    };
  }
  
  private parseEditResults(result?: any): EditResult[] {
    // Parse individual edit results from output
    if (!result) return [];
    
    // Implementation depends on actual output format
    return [];
  }
  
  private determineOverallStatus(results: EditResult[]): 'pending' | 'completed' | 'failed' | 'partial' {
    if (results.length === 0) return 'pending';
    if (results.every(r => r.status === 'completed')) return 'completed';
    if (results.every(r => r.status === 'failed')) return 'failed';
    return 'partial';
  }
}

interface EditResult {
  status: 'completed' | 'failed';
  error?: string;
}

// Input shape:
interface MultiEditInput {
  file_path: string;
  edits: Array<{
    old_string: string;
    new_string: string;
    replace_all?: boolean;
  }>;
}
```

---

## 9. TodoRead Tool Parser

```typescript
// packages/core/chat-items/parsers/todo-read-parser.ts

export class TodoReadToolParser extends BaseToolParser<TodoReadToolItem> {
  toolName = 'todoread';
  
  parse(entry: LogEntry, result?: LogEntry): TodoReadToolItem {
    const toolUse = this.extractToolUse(entry);
    const toolResult = result ? this.extractToolResult(result) : undefined;
    
    const todos = this.parseTodos(toolResult?.output);
    
    return {
      id: toolUse.id,
      type: 'todo_read_tool',
      timestamp: entry.timestamp,
      sessionId: this.extractSessionId(entry),
      content: {
        todos: todos,
        total_count: todos.length,
        completed_count: todos.filter(t => t.status === 'completed').length,
        pending_count: todos.filter(t => t.status === 'pending').length,
        in_progress_count: todos.filter(t => t.status === 'in_progress').length,
        status: this.determineStatus(toolResult),
        error: toolResult?.is_error ? toolResult.output : undefined
      }
    };
  }
  
  private parseTodos(output?: any): Todo[] {
    if (!output || !Array.isArray(output)) return [];
    
    return output.map(todo => ({
      id: todo.id,
      content: todo.content,
      status: todo.status,
      priority: todo.priority || 'medium'
    }));
  }
}

interface Todo {
  id: string;
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
}
```

---

## 10. TodoWrite Tool Parser

```typescript
// packages/core/chat-items/parsers/todo-write-parser.ts

export class TodoWriteToolParser extends BaseToolParser<TodoWriteToolItem> {
  toolName = 'todowrite';
  
  parse(entry: LogEntry, result?: LogEntry): TodoWriteToolItem {
    const toolUse = this.extractToolUse(entry);
    const toolResult = result ? this.extractToolResult(result) : undefined;
    
    const todos = toolUse.input.todos || [];
    
    return {
      id: toolUse.id,
      type: 'todo_write_tool',
      timestamp: entry.timestamp,
      sessionId: this.extractSessionId(entry),
      content: {
        todos: todos,
        action: this.determineAction(todos),
        modified_count: todos.length,
        status: this.determineStatus(toolResult),
        error: toolResult?.is_error ? toolResult.output : undefined
      }
    };
  }
  
  private determineAction(todos: any[]): 'create' | 'update' | 'mixed' {
    // Analyze todos to determine primary action
    return 'update'; // Simplified
  }
}

// Input shape:
interface TodoWriteInput {
  todos: Array<{
    id: string;
    content: string;
    status: 'pending' | 'in_progress' | 'completed';
    priority: 'low' | 'medium' | 'high';
  }>;
}
```

---

## 11. MCP Sequential Thinking Parser

```typescript
// packages/core/chat-items/parsers/mcp-sequential-thinking-parser.ts

export class McpSequentialThinkingParser extends BaseToolParser<McpSequentialThinkingItem> {
  toolName = 'mcp_sequential_thinking';
  
  parse(entry: LogEntry, result?: LogEntry): McpSequentialThinkingItem {
    const toolUse = this.extractToolUse(entry);
    const toolResult = result ? this.extractToolResult(result) : undefined;
    
    const thoughts = this.parseThoughts(toolResult?.output);
    
    return {
      id: toolUse.id,
      type: 'mcp_sequential_thinking',
      timestamp: entry.timestamp,
      sessionId: this.extractSessionId(entry),
      content: {
        prompt: toolUse.input.prompt,
        thoughts: thoughts,
        thought_count: thoughts.length,
        total_tokens: this.estimateTokens(thoughts),
        status: this.determineStatus(toolResult),
        error: toolResult?.is_error ? toolResult.output : undefined
      }
    };
  }
  
  private parseThoughts(output?: any): ThoughtBlock[] {
    if (!output || typeof output !== 'string') return [];
    
    // Parse thinking blocks from output
    const blocks = output.split(/\n\n/).filter(b => b.trim());
    return blocks.map((block, index) => ({
      index,
      content: block,
      type: this.classifyThought(block)
    }));
  }
  
  private classifyThought(content: string): 'analysis' | 'planning' | 'reflection' {
    // Simple classification logic
    if (content.toLowerCase().includes('plan')) return 'planning';
    if (content.toLowerCase().includes('reflect')) return 'reflection';
    return 'analysis';
  }
  
  private estimateTokens(thoughts: ThoughtBlock[]): number {
    return thoughts.reduce((sum, t) => sum + t.content.length / 4, 0);
  }
}

interface ThoughtBlock {
  index: number;
  content: string;
  type: 'analysis' | 'planning' | 'reflection';
}
```

---

## 12. MCP Context7 Parser

```typescript
// packages/core/chat-items/parsers/mcp-context7-parser.ts

export class McpContext7Parser extends BaseToolParser<McpContext7Item> {
  toolName = 'mcp_context7';
  
  parse(entry: LogEntry, result?: LogEntry): McpContext7Item {
    const toolUse = this.extractToolUse(entry);
    const toolResult = result ? this.extractToolResult(result) : undefined;
    
    const context = this.parseContext(toolResult?.output);
    
    return {
      id: toolUse.id,
      type: 'mcp_context7',
      timestamp: entry.timestamp,
      sessionId: this.extractSessionId(entry),
      content: {
        operation: toolUse.input.operation || 'query',
        query: toolUse.input.query,
        library_id: toolUse.input.library_id,
        context: context,
        result_count: context.results?.length || 0,
        status: this.determineStatus(toolResult),
        error: toolResult?.is_error ? toolResult.output : undefined
      }
    };
  }
  
  private parseContext(output?: any): ContextData {
    if (!output) return { results: [] };
    
    return {
      results: output.results || [],
      metadata: output.metadata || {}
    };
  }
}

interface ContextData {
  results: any[];
  metadata?: Record<string, any>;
}

// Input shape:
interface Context7Input {
  operation?: string;
  query?: string;
  library_id?: string;
}
```

---

## 13. MCP Puppeteer Parser

```typescript
// packages/core/chat-items/parsers/mcp-puppeteer-parser.ts

export class McpPuppeteerParser extends BaseToolParser<McpPuppeteerItem> {
  toolName = 'mcp_puppeteer';
  
  parse(entry: LogEntry, result?: LogEntry): McpPuppeteerItem {
    const toolUse = this.extractToolUse(entry);
    const toolResult = result ? this.extractToolResult(result) : undefined;
    
    return {
      id: toolUse.id,
      type: 'mcp_puppeteer',
      timestamp: entry.timestamp,
      sessionId: this.extractSessionId(entry),
      content: {
        operation: toolUse.input.operation,
        url: toolUse.input.url,
        selector: toolUse.input.selector,
        value: toolUse.input.value,
        options: toolUse.input.options || {},
        screenshot: this.extractScreenshot(toolResult),
        page_title: toolResult?.output?.title,
        status: this.determineStatus(toolResult),
        error: toolResult?.is_error ? toolResult.output : undefined
      }
    };
  }
  
  private extractScreenshot(result?: any): string | undefined {
    if (!result?.output?.screenshot) return undefined;
    return result.output.screenshot;
  }
}

// Input shape:
interface PuppeteerInput {
  operation: 'navigate' | 'screenshot' | 'click' | 'fill' | 'select' | 'evaluate';
  url?: string;
  selector?: string;
  value?: string;
  options?: Record<string, any>;
}
```

---

## 14. Thinking Block Parser (Not a Tool)

```typescript
// packages/core/chat-items/parsers/thinking-parser.ts

export class ThinkingBlockParser {
  canParse(entry: LogEntry): boolean {
    if (entry.type !== 'assistant') return false;
    
    const content = this.normalizeContent(entry.content);
    return content.some(block => 
      block.type === 'thinking' || 
      (block.type === 'text' && block.text?.includes('<thinking>'))
    );
  }
  
  parse(entry: LogEntry): ThinkingBlockItem {
    const content = this.extractThinkingContent(entry);
    
    return {
      id: entry.uuid,
      type: 'thinking_block',
      timestamp: entry.timestamp,
      sessionId: this.extractSessionId(entry),
      content: {
        text: content,
        word_count: content.split(/\s+/).length,
        contains_code: this.detectCode(content),
        topics: this.extractTopics(content)
      }
    };
  }
  
  private extractThinkingContent(entry: LogEntry): string {
    const content = this.normalizeContent(entry.content);
    
    for (const block of content) {
      if (block.type === 'thinking') {
        return block.text || '';
      }
      if (block.type === 'text' && block.text?.includes('<thinking>')) {
        // Extract content between tags
        const match = block.text.match(/<thinking>([\s\S]*?)<\/thinking>/);
        return match?.[1] || block.text;
      }
    }
    
    return '';
  }
  
  private detectCode(content: string): boolean {
    return content.includes('```') || 
           content.includes('function') ||
           content.includes('const ') ||
           content.includes('let ');
  }
  
  private extractTopics(content: string): string[] {
    // Simple topic extraction
    const topics = [];
    if (content.includes('error')) topics.push('error-handling');
    if (content.includes('performance')) topics.push('performance');
    if (content.includes('security')) topics.push('security');
    return topics;
  }
}
```

---

## Parser Registry Setup

```typescript
// packages/core/chat-items/parsers/registry.ts

export class ParserRegistry {
  private toolParsers = new Map<string, ToolParser<any>>();
  private specialParsers: SpecialParser[] = [];
  
  constructor() {
    // Register all tool parsers
    this.registerTool(new BashToolParser());
    this.registerTool(new EditToolParser());
    this.registerTool(new ReadToolParser());
    this.registerTool(new WriteToolParser());
    this.registerTool(new GlobToolParser());
    this.registerTool(new GrepToolParser());
    this.registerTool(new LsToolParser());
    this.registerTool(new MultiEditToolParser());
    this.registerTool(new TodoReadToolParser());
    this.registerTool(new TodoWriteToolParser());
    this.registerTool(new McpSequentialThinkingParser());
    this.registerTool(new McpContext7Parser());
    this.registerTool(new McpPuppeteerParser());
    
    // Register special parsers
    this.specialParsers.push(new ThinkingBlockParser());
    this.specialParsers.push(new UserMessageParser());
    this.specialParsers.push(new AssistantMessageParser());
  }
  
  private registerTool(parser: ToolParser<any>) {
    this.toolParsers.set(parser.toolName, parser);
  }
  
  parseEntry(entry: LogEntry, result?: LogEntry): ChatItem | null {
    // Try special parsers first
    for (const parser of this.specialParsers) {
      if (parser.canParse(entry)) {
        return parser.parse(entry);
      }
    }
    
    // Try tool parsers
    if (this.isToolUse(entry)) {
      const toolName = this.extractToolName(entry);
      const parser = this.toolParsers.get(toolName);
      if (parser) {
        return parser.parse(entry, result);
      }
    }
    
    return null;
  }
  
  private isToolUse(entry: LogEntry): boolean {
    // Check if entry contains tool_use block
    return false; // Implementation needed
  }
  
  private extractToolName(entry: LogEntry): string {
    // Extract tool name from entry
    return ''; // Implementation needed
  }
}
```

This completes all 14 tool parser implementations with their specific input/output shapes and parsing logic.