// Main exports for the log-processor package
export { FileMonitor } from "./monitor/file-monitor.js";
export { ProjectResolver } from "./services/project-resolver.js";
export { CorrelationEngine } from "./transformer/correlation-engine.js";

// Export types
export type {
	ActiveSession,
	CorrelatedPair,
	CorrelationEngineEvents,
	CorrelationEngineOptions,
	LogMonitorEvents,
	MonitorOptions,
	PendingCorrelation,
} from "./types.js";
