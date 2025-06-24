// Component-based UI system exports

// Core components
export { type BoxColor, createPerfectBox, smartTruncate } from './components/BoxComponent.js';
export { displayAssistantMessage, logAssistantMessage } from './components/MessageCard.js';
export { displayToolResultSummary, logToolResultSummary } from './components/ResultSummary.js';
export { displaySessionSummary, logSessionSummary } from './components/SessionSummary.js';
export { displayTodoTable, logTodoTable } from './components/TodoTable.js';
export { displayToolCallCard, logToolCallCard } from './components/ToolCallCard.js';
// Demo functions (moved to tests/ui-demo.ts)
// Formatters
export { type ComponentDisplayOptions, formatMessage } from './formatters/MessageFormatter.js';
export { ComponentMessageStreamRenderer } from './formatters/StreamRenderer.js';
// Layout utilities
export {
  getAdaptiveWidth,
  getResponsiveWidth,
  type ResponsiveOptions,
} from './layout/TerminalLayout.js';
// Content utilities
export { generateResultMetrics, getToolIcon } from './utils/content-summarizer.js';
// Terminal utilities
export { getExactTerminalWidth, getTerminalWidth } from './utils/terminal-size.js';
