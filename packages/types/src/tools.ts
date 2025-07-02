// Tool-specific content types for ChatItems

export interface BashToolContent {
  command: string;
  description?: string;
  timeout?: number;
  output?: {
    stdout: string;
    stderr: string;
    exitCode: number;
    isError: boolean;
    interrupted?: boolean;
  };
  status: ToolStatus;
}

export interface EditToolContent {
  filePath: string;
  oldString: string;
  newString: string;
  replaceAll?: boolean;
  output?: {
    success: boolean;
    error?: string;
  };
  status: ToolStatus;
}

export interface ReadToolContent {
  filePath: string;
  limit?: number;
  offset?: number;
  output?: {
    content: string;
    lineCount: number;
    error?: string;
  };
  status: ToolStatus;
}

export interface WriteToolContent {
  filePath: string;
  content: string;
  output?: {
    success: boolean;
    error?: string;
  };
  status: ToolStatus;
}

export interface GlobToolContent {
  pattern: string;
  path?: string;
  output?: {
    matches: string[];
    count: number;
    error?: string;
  };
  status: ToolStatus;
}

export interface GrepToolContent {
  pattern: string;
  path?: string;
  include?: string;
  output?: {
    matches: Array<{
      file: string;
      line: number;
      content: string;
    }>;
    error?: string;
  };
  status: ToolStatus;
}

export interface LsToolContent {
  path: string;
  ignore?: string[];
  output?: {
    entries: Array<{
      name: string;
      type: 'file' | 'directory';
      size?: number;
    }>;
    error?: string;
  };
  status: ToolStatus;
}

export interface MultiEditToolContent {
  filePath: string;
  edits: Array<{
    oldString: string;
    newString: string;
    replaceAll?: boolean;
  }>;
  output?: {
    success: boolean;
    appliedEdits: number;
    error?: string;
  };
  status: ToolStatus;
}

export interface TodoReadToolContent {
  output?: {
    todos: Array<{
      id: string;
      content: string;
      status: 'pending' | 'in_progress' | 'completed';
      priority: 'high' | 'medium' | 'low';
    }>;
    error?: string;
  };
  status: ToolStatus;
}

export interface TodoWriteToolContent {
  todos: Array<{
    id: string;
    content: string;
    status: 'pending' | 'in_progress' | 'completed';
    priority: 'high' | 'medium' | 'low';
  }>;
  output?: {
    success: boolean;
    error?: string;
  };
  status: ToolStatus;
}

export interface McpSequentialThinkingContent {
  thoughts: string[];
  output?: {
    result: unknown;
    error?: string;
  };
  status: ToolStatus;
}

export interface McpContext7Content {
  query: string;
  context?: string;
  output?: {
    result: unknown;
    error?: string;
  };
  status: ToolStatus;
}

export interface McpPuppeteerContent {
  action: string;
  params: Record<string, unknown>;
  output?: {
    result: unknown;
    error?: string;
  };
  status: ToolStatus;
}

export interface ThinkingBlockContent {
  thoughts: string;
}

export interface UserMessageContent {
  text: string;
}

export interface AssistantMessageContent {
  text: string;
}

export type ToolStatus = 'pending' | 'running' | 'completed' | 'failed' | 'timeout';