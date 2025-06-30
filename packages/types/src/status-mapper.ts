import type { ToolStatus } from './ui-props';

/**
 * Centralized status mapping for MCP tools.
 * Maps diverse status values to normalized UI status.
 */

// Status mappings for known tools
const STATUS_MAPPINGS: Record<string, Record<string, string>> = {
  // Known MCP tools
  "mcp-puppeteer": {
    "success": "completed",
    "error": "failed",
    "partial": "running"
  },
  "mcp-context7": {
    "resolved": "completed", 
    "failed": "failed",
    "not_found": "failed"
  },
  "mcp-sequential-thinking": {
    "in_progress": "running",
    "completed": "completed",
    "failed": "failed"
  },
  // Standard tools
  "bash": {
    "success": "completed",
    "error": "failed",
    "timeout": "failed",
    "interrupted": "interrupted"
  },
  "read": {
    "success": "completed",
    "error": "failed",
    "not_found": "failed"
  },
  "write": {
    "success": "completed",
    "error": "failed",
    "permission_denied": "failed"
  },
  "edit": {
    "success": "completed",
    "error": "failed",
    "no_match": "failed"
  },
  "grep": {
    "success": "completed",
    "error": "failed",
    "no_matches": "completed"
  }
  // Add more as we encounter them
};

// Cache for unknown status combinations
const unknownStatusCache = new Set<string>();
let logger: ((toolType: string, status: string) => void) | undefined;

/**
 * Map tool status to normalized UI status.
 * Uses explicit mappings first, then pattern inference.
 */
export function mapStatus(toolType: string, originalStatus: string): ToolStatus {
  // 1. Check explicit mapping
  const mapping = STATUS_MAPPINGS[toolType.toLowerCase()];
  if (mapping?.[originalStatus]) {
    return {
      normalized: mapping[originalStatus] as ToolStatus['normalized'],
      original: originalStatus
    };
  }
  
  // 2. Pattern-based inference for unknown tools
  const normalized = inferStatus(originalStatus);
  
  // 3. Track unknown patterns for future improvement
  if (normalized === "unknown") {
    trackUnknownStatus(toolType, originalStatus);
  }
  
  return {
    normalized,
    original: originalStatus
  };
}

/**
 * Map from boolean error flag to status (for simple tools)
 */
export function mapFromError(
  isError: boolean | undefined, 
  isPending: boolean = false,
  isInterrupted: boolean = false
): ToolStatus {
  if (isPending) {
    return { normalized: "pending" };
  }
  
  if (isInterrupted) {
    return { 
      normalized: "interrupted",
      details: { interrupted: true }
    };
  }
  
  return {
    normalized: isError ? "failed" : "completed"
  };
}

/**
 * Map with progress information
 */
export function mapWithProgress(
  toolType: string, 
  originalStatus: string, 
  progress?: number,
  substatus?: string
): ToolStatus {
  const baseStatus = mapStatus(toolType, originalStatus);
  
  if (progress !== undefined || substatus) {
    return {
      ...baseStatus,
      details: {
        progress,
        substatus
      }
    };
  }
  
  return baseStatus;
}

/**
 * Set a logger function for unknown status tracking
 * This allows types package to remain pure while enabling logging
 */
export function setStatusLogger(loggerFn: (toolType: string, status: string) => void) {
  logger = loggerFn;
}

/**
 * Helper to determine if a status represents a terminal state
 */
export function isTerminal(status: ToolStatus): boolean {
  return status.normalized === 'completed' || 
         status.normalized === 'failed' ||
         status.normalized === 'interrupted' ||
         status.normalized === 'unknown';
}

/**
 * Helper to determine if a status represents success
 */
export function isSuccess(status: ToolStatus): boolean {
  return status.normalized === 'completed';
}

/**
 * Helper to determine if a status represents failure
 */
export function isFailure(status: ToolStatus): boolean {
  return status.normalized === 'failed';
}

/**
 * Helper to determine if a status represents interruption
 */
export function isInterrupted(status: ToolStatus): boolean {
  return status.normalized === 'interrupted';
}

// Private helper functions

function inferStatus(status: string): ToolStatus['normalized'] {
  const lower = status.toLowerCase();
  
  // Check for success patterns
  if (
    lower.includes('success') || 
    lower.includes('ok') || 
    lower.includes('complete') ||
    lower.includes('done') ||
    lower === 'true'
  ) {
    return 'completed';
  }
  
  // Check for interrupted patterns
  if (
    lower.includes('interrupt') ||
    lower.includes('cancelled') ||
    lower.includes('cancel') ||
    lower.includes('stopped') ||
    lower.includes('aborted')
  ) {
    return 'interrupted';
  }
  
  // Check for failure patterns
  if (
    lower.includes('error') || 
    lower.includes('fail') || 
    lower.includes('crash') ||
    lower.includes('exception') ||
    lower === 'false'
  ) {
    return 'failed';
  }
  
  // Check for pending patterns
  if (
    lower.includes('pending') || 
    lower.includes('wait') || 
    lower.includes('queue') ||
    lower.includes('scheduled')
  ) {
    return 'pending';
  }
  
  // Check for running patterns
  if (
    lower.includes('running') || 
    lower.includes('progress') || 
    lower.includes('partial') ||
    lower.includes('processing') ||
    lower.includes('executing')
  ) {
    return 'running';
  }
  
  return 'unknown';
}

function trackUnknownStatus(toolType: string, status: string) {
  const key = `${toolType}:${status}`;
  
  // Only log once per unknown combination to avoid spam
  if (!unknownStatusCache.has(key)) {
    unknownStatusCache.add(key);
    
    // Use injected logger if available, otherwise fallback to console
    if (logger) {
      logger(toolType, status);
    } else {
      console.warn(`🔍 New MCP tool discovered: ${toolType}:${status} - consider contributing this mapping to improve the ecosystem`);
    }
  }
}