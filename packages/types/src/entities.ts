// Raw data from Claude's JSONL files - WE DON'T CONTROL THIS FORMAT
export interface LogEntry {
  uuid: string;
  parentUuid?: string;
  timestamp: string;
  type: 'user' | 'assistant';
  content: string | MessageContent | MessageContent[];
  isSidechain?: boolean;
}

export interface MessageContent {
  type: 'text' | 'tool_use' | 'tool_result' | 'thinking';
  text?: string;
  content?: string;      // tool_result content (used in real Claude Code output)
  id?: string;           // tool_use_id
  name?: string;         // tool name
  input?: Record<string, any>;  // tool input
  output?: any;          // tool result
  is_error?: boolean;
  tool_use_id?: string;  // for tool_result
}

// Our domain models
export interface Session {
  id: string;                      // From JSONL filename
  projectPath: string;             // Decoded from directory name
  encodedProjectPath: string;      // As stored by Claude
  isActive: boolean;
  lastActivity: Date;
  messageCount: number;
  hasToolUsage: boolean;
  createdAt: Date;
  fileSize: number;
  githubRepo?: GitHubRepo;
}

export interface Project {
  path: string;                    // Real path like /Users/bob/my-project
  encodedPath: string;             // Claude's encoding
  name: string;
  sessionCount: number;
  hasActiveSessions: boolean;
  lastActivity: Date;
  githubRepo?: GitHubRepo;
}

export interface GitHubRepo {
  owner: string;
  repo: string;
  url: string;
}

// UI-ready format
export interface ChatItem {
  id: string;
  type: ChatItemType;
  timestamp: string;
  sessionId: string;
  content: unknown;  // Varies by type
}

export type ChatItemType = 
  | 'user_message' | 'assistant_message' | 'thinking_block'
  | 'bash_tool' | 'edit_tool' | 'read_tool' | 'write_tool'
  | 'glob_tool' | 'grep_tool' | 'ls_tool' | 'multi_edit_tool'
  | 'todo_read_tool' | 'todo_write_tool'
  | 'mcp_sequential_thinking' | 'mcp_context7' | 'mcp_puppeteer';