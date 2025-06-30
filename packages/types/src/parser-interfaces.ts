import type { LogEntry } from './entities';
import type { BaseToolProps } from './ui-props';

/**
 * Base parser interface that all tool parsers implement.
 * Enforces consistent parsing patterns across all tools.
 */
export interface ToolParser<TProps extends BaseToolProps> {
  /**
   * Parse raw log entries into UI-ready props.
   * Handles status mapping and correlation data extraction.
   * 
   * @param toolCall - The log entry containing the tool call
   * @param toolResult - Optional log entry containing the tool result
   * @param config - Optional parsing configuration
   * @returns UI-ready props for the tool
   */
  parse(toolCall: LogEntry, toolResult?: LogEntry, config?: ParseConfig): TProps;
  
  /**
   * Validate log entries before parsing.
   * Ensures the entry contains the expected tool call data.
   * 
   * @param entry - The log entry to validate
   * @returns Validation result with any errors or warnings
   */
  validate(entry: LogEntry): ValidationResult;
  
  /**
   * Check if this parser can handle the given log entry.
   * Used for parser selection in the correlation engine.
   * 
   * @param entry - The log entry to check
   * @returns True if this parser can handle the entry
   */
  canParse(entry: LogEntry): boolean;
  
  /**
   * Get parser metadata and capabilities.
   * Used for debugging and parser registry.
   */
  getMetadata(): ParserMetadata;
}

/**
 * Configuration options for parsing
 */
export interface ParseConfig {
  preserveTimestamps?: boolean;
  maxContentLength?: number;
  validateOutput?: boolean;
  debug?: boolean;
  includeRawData?: boolean;
}

/**
 * Result of validation
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  fixable?: boolean;
}

/**
 * Parser metadata for registry and debugging
 */
export interface ParserMetadata {
  toolName: string;
  toolType: string;
  version: string;
  supportedFeatures: string[];
  mcp?: {
    serverName?: string;
    capabilities?: string[];
  };
}

/**
 * Base interface for parse errors
 */
export interface ParseError extends Error {
  readonly code: ParseErrorCode;
  readonly fixture?: any;
  readonly context?: Record<string, any>;
}

/**
 * Implementation of ParseError that can be thrown
 */
export class ParseErrorImpl extends Error implements ParseError {
  constructor(
    message: string,
    public readonly code: ParseErrorCode,
    public readonly fixture?: any,
    public readonly context?: Record<string, any>
  ) {
    super(message);
    this.name = "ParseError";
    
    // Restore prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
    
    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ParseErrorImpl);
    }
  }
}

export type ParseErrorCode =
  | "INVALID_FIXTURE_FORMAT"
  | "MISSING_CORRELATION_DATA"
  | "MISSING_REQUIRED_FIELD"
  | "INVALID_FIELD_TYPE"
  | "CONTENT_TOO_LARGE"
  | "UNSUPPORTED_TOOL_TYPE"
  | "STATUS_MAPPING_FAILED"
  | "VALIDATION_FAILED";

/**
 * Options for graceful degradation when parsing fails
 */
export interface FallbackOptions {
  useDefaults: boolean;        // Provide default values for missing fields
  skipValidation: boolean;     // Try to parse despite validation errors
  maxWarnings: number;         // Fail after too many warnings
  preserveOriginal: boolean;   // Keep original data for debugging
}

/**
 * Base interface for fixture data from legacy parsers
 */
export interface BaseFixtureData {
  toolCall: {
    uuid: string;
    timestamp: string;
    parentUuid?: string;
    tool: {
      id: string;
      name: string;
      input: Record<string, any>;
    };
  };
  toolResult?: {
    uuid?: string;
    timestamp?: string;
    toolUseId: string;
    output?: any;
    isError?: boolean;
    error?: string;
    stdout?: string;
    stderr?: string;
  };
}

/**
 * Registry for all available parsers
 */
export interface ParserRegistry {
  register<T extends BaseToolProps>(
    toolName: string, 
    parser: ToolParser<T>
  ): void;
  
  get<T extends BaseToolProps>(
    toolName: string
  ): ToolParser<T> | undefined;
  
  getForEntry<T extends BaseToolProps>(
    entry: LogEntry
  ): ToolParser<T> | undefined;
  
  list(): ParserMetadata[];
}