import pino from 'pino';

/**
 * Centralized logger configuration for Claude Codex
 * 
 * Uses Pino for structured logging with pretty formatting in development.
 * Provides different log levels for different environments.
 */

// Environment-based log level configuration
const getLogLevel = (): string => {
  if (process.env.NODE_ENV === 'test') {
    return 'silent'; // No logs during testing
  }
  
  if (process.env.NODE_ENV === 'production') {
    return 'info'; // Production: info and above
  }
  
  return process.env.LOG_LEVEL || 'debug'; // Development: debug and above
};

// Pretty formatting for development
const getTransport = () => {
  if (process.env.NODE_ENV === 'production') {
    return undefined; // No transport in production (raw JSON)
  }
  
  return {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname',
      singleLine: true,
    },
  };
};

/**
 * Main application logger
 */
export const logger = pino({
  name: 'claude-codex',
  level: getLogLevel(),
  ...(getTransport() && { transport: getTransport() }),
});

/**
 * Create child logger for specific components
 */
export const createChildLogger = (component: string) => {
  return logger.child({ component });
};

// Note: Components should create their own child loggers using createChildLogger()
// Example: const logger = createChildLogger('my-component');

export default logger;