/**
 * @fileoverview Core API type definitions
 * @module @dao/codex-api-server/types/api
 */

// Re-export types from dependencies
// export type {
// 	ActiveSession,
// 	LogEntry as MonitorLogEntry,
// 	MonitorOptions,
// } from "@dao/codex-log-monitor";

// export type {
// 	LogEntry as TransformerLogEntry,
// 	TransformError,
// 	TransformedItem,
// 	TransformResult,
// } from "@dao/transformer";

// // Re-import for local use
// import type { TransformedItem } from "@dao/transformer";

/**
 * Session metadata for API responses
 */
export interface SessionInfo {
  /** Session UUID from filename */
  id: string;
  /** Decoded working directory path */
  projectPath: string;
  /** ISO timestamp of last activity */
  lastActivity: string;
  /** Total number of messages in session */
  messageCount: number;
  /** Whether session contains tool interactions */
  hasToolUsage: boolean;
  /** Whether session is currently active */
  isActive: boolean;
  /** ISO timestamp of first message */
  createdAt: string;
  /** JSONL file size in bytes */
  fileSize: number;
}

/**
 * Log entry for API responses (processed from raw JSONL)
 */
export interface LogEntry {
  /** Message UUID */
  uuid: string;
  /** Parent message UUID */
  parentUuid?: string;
  /** Session identifier */
  sessionId: string;
  /** ISO timestamp */
  timestamp: string;
  /** Message sender type */
  type: "user" | "assistant";
  /** Message content (string or structured object) */
  content: string | object;
  /** Whether this is a side conversation */
  isSidechain?: boolean;
  /** Tool usage information if applicable */
  toolUse?: ToolUseInfo;
}

/**
 * Tool usage information within a log entry
 */
export interface ToolUseInfo {
  /** Tool use ID for correlation */
  id: string;
  /** Tool name (e.g., "Bash", "Read", "Edit") */
  name: string;
  /** Tool input parameters */
  input: Record<string, unknown>;
  /** Tool result if available */
  result?: string | object;
  /** Tool execution status */
  status: "pending" | "completed" | "failed";
}

/**
 * Project information for API responses
 */
export interface ProjectInfo {
  /** Encoded project path */
  path: string;
  /** Decoded readable path */
  decodedPath: string;
  /** Number of sessions in this project */
  sessionCount: number;
  /** Most recent session activity */
  lastActivity: string;
  /** Total size of all sessions in bytes */
  totalSize: number;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  /** Array of items */
  data: T[];
  /** Total number of items available */
  total: number;
  /** Current page limit */
  limit: number;
  /** Current page offset */
  offset: number;
  /** Whether there are more items available */
  hasMore: boolean;
}

/**
 * API error response format
 */
export interface APIError {
  /** Error code identifier */
  error: string;
  /** Human-readable error message */
  message: string;
  /** Additional error context */
  details?: object;
  /** ISO timestamp when error occurred */
  timestamp: string;
}

/**
 * WebSocket message types from client to server
 */
export type WSClientMessage =
  | {
      type: "subscribe";
      target: "session";
      sessionId: string;
    }
  | {
      type: "subscribe";
      target: "project";
      projectPath: string;
    }
  | {
      type: "subscribe";
      target: "active";
    }
  | {
      type: "unsubscribe";
      target: "session" | "project" | "active";
      id?: string;
    }
  | {
      type: "ping";
    };

/**
 * WebSocket message types from server to client
 */
export type WSServerMessage =
  | {
      type: "connected";
      clientId: string;
    }
  | {
      type: "log_entry";
      sessionId: string;
      data: LogEntry;
    }
  | {
      type: "transformed_item";
      sessionId: string;
      data: TransformedItem;
    }
  | {
      type: "session_update";
      data: SessionInfo;
    }
  | {
      type: "pong";
    }
  | {
      type: "error";
      code: string;
      message: string;
      details?: object;
    };

/**
 * Request query parameters for session listing
 */
export interface SessionsQuery {
  /** Filter to active sessions only */
  active?: boolean;
  /** Filter by project path */
  project?: string;
  /** Pagination limit */
  limit?: number;
  /** Pagination offset */
  offset?: number;
}

/**
 * Request query parameters for session history
 */
export interface SessionHistoryQuery {
  /** Number of entries per page */
  limit?: number;
  /** Pagination offset */
  offset?: number;
  /** Filter by message type */
  type?: "user" | "assistant";
  /** Filter entries since this timestamp */
  since?: string;
}

/**
 * Tool usage statistics
 */
export interface ToolUsageStats {
  /** Tool name */
  toolName: string;
  /** Number of times used */
  usageCount: number;
  /** Success rate (0-1) */
  successRate: number;
  /** Average execution time in milliseconds */
  avgExecutionTime: number;
  /** Most recent usage timestamp */
  lastUsed: string;
}

/**
 * System metrics response
 */
export interface SystemMetrics {
  /** Server uptime in seconds */
  uptime: number;
  /** Memory usage information */
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  /** Active WebSocket connections */
  activeConnections: number;
  /** Total API requests served */
  totalRequests: number;
  /** Request rate (requests per minute) */
  requestRate: number;
  /** Cache hit rate (0-1) */
  cacheHitRate: number;
}

/**
 * Health check response
 */
export interface HealthResponse {
  /** Service status */
  status: "healthy" | "degraded" | "unhealthy";
  /** Current timestamp */
  timestamp: string;
  /** Service version */
  version: string;
  /** Server uptime in seconds */
  uptime: number;
  /** Component health details */
  components?: {
    database?: "healthy" | "unhealthy";
    monitor?: "healthy" | "unhealthy";
    transformer?: "healthy" | "unhealthy";
  };
}
