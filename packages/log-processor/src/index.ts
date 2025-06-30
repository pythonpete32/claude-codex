// Main exports for the log-processor package
export { FileMonitor } from './monitor/file-monitor.js';
export { CorrelationEngine } from './transformer/correlation-engine.js';
export { ProjectResolver } from './services/project-resolver.js';

// Export types
export type {
  MonitorOptions,
  ActiveSession,
  LogMonitorEvents,
  PendingCorrelation,
  CorrelatedPair,
  CorrelationEngineEvents,
  CorrelationEngineOptions,
} from './types.js';
