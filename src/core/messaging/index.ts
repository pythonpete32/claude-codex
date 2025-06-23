// Main SDK wrapper

// Debug logging
export {
  type DebugLog,
  type DebugMetadata,
  type DebugOptions,
  generateDebugFileName,
  loadDebugMessages,
  logDebugMessages,
} from './debug-logger.js';

// Message processing
export {
  type DisplayOptions,
  formatMessageForDisplay,
  processMessagesWithDisplay,
} from './message-processor.js';

// Result extraction
export {
  type ExtractedResults,
  extractAgentResults,
  formatExecutionSummary,
  logFinalResponse,
} from './result-extractor.js';
// SDK wrapper
export {
  type AgentResult,
  type ClaudeAgentOptions,
  runClaudeAgent,
} from './sdk-wrapper.js';

// Component-based UI system
export {
  // Types
  type BoxColor,
  type ComponentDisplayOptions,
  ComponentMessageStreamRenderer,
  // Core components
  createPerfectBox,
  displayAssistantMessage,
  displaySessionSummary,
  displayTodoTable,
  displayToolCallCard,
  displayToolResultSummary,
  // Formatters
  formatMessage,
  // Layout utilities
  getAdaptiveWidth,
  getResponsiveWidth,
  type ResponsiveOptions,
  smartTruncate,
} from './ui/index.js';
