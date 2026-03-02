// HiSol Container-based Logger
// Label-like functionality using Container IDs

/**
 * Container ID type
 */
export type ContainerID =
  | 'C-001' // HiSol Unified MCP Server
  | 'C-002' // ARHA Analytics Engine
  | 'C-003' // ARHA Agent Engine
  | 'C-004' // Command Container
  | 'C-005' // Orchestration Container
  | 'C-006' // Status Container
  | 'C-007' // API Gateway Container
  | 'C-008' // Vibe Compliance Container
  ;

/**
 * Log level type
 */
export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

/**
 * Log metadata interface
 */
export interface LogMetadata {
  [key: string]: any;
}

/**
 * Structured log entry
 */
export interface LogEntry {
  timestamp: string;
  containerId: ContainerID;
  level: LogLevel;
  message: string;
  metadata?: LogMetadata;
}

/**
 * ANSI color codes for terminal output
 */
const COLORS = {
  // Container colors
  'C-001': '\x1b[36m',  // Cyan - Server
  'C-002': '\x1b[35m',  // Magenta - Analytics
  'C-003': '\x1b[34m',  // Blue - Agents
  'C-004': '\x1b[33m',  // Yellow - Command
  'C-005': '\x1b[32m',  // Green - Orchestration
  'C-006': '\x1b[37m',  // White - Status
  'C-007': '\x1b[36m',  // Cyan - API Gateway
  'C-008': '\x1b[35m',  // Magenta - Vibe Compliance

  // Level colors
  'INFO': '\x1b[37m',   // White
  'WARN': '\x1b[33m',   // Yellow
  'ERROR': '\x1b[31m',  // Red
  'DEBUG': '\x1b[90m',  // Gray

  // Reset
  'RESET': '\x1b[0m'
};

/**
 * Container name mapping for better readability
 */
const CONTAINER_NAMES: Record<ContainerID, string> = {
  'C-001': 'Server',
  'C-002': 'Analytics',
  'C-003': 'Agent',
  'C-004': 'Command',
  'C-005': 'Orchestration',
  'C-006': 'Status',
  'C-007': 'APIGateway',
  'C-008': 'VibeCompliance'
};

/**
 * Main logger function - Label-like functionality
 *
 * @example
 * ```typescript
 * import { log } from './utils/logger';
 *
 * log('C-007', 'INFO', 'Processing request', { method: 'POST', path: '/api/login' });
 * log('C-008', 'WARN', 'Low test coverage', { coverage: 45, threshold: 70 });
 * log('C-003', 'ERROR', 'Agent execution failed', { error: err.message });
 * ```
 */
export function log(
  containerId: ContainerID,
  level: LogLevel,
  message: string,
  metadata?: LogMetadata
): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    containerId,
    level,
    message,
    metadata
  };

  // Colored terminal output
  const containerColor = COLORS[containerId] || '';
  const levelColor = COLORS[level] || '';
  const reset = COLORS.RESET;

  const containerLabel = `[${containerId}:${CONTAINER_NAMES[containerId]}]`;
  const formattedLog =
    `${containerColor}${containerLabel}${reset} ` +
    `${levelColor}${level}${reset} ` +
    `${message}` +
    (metadata ? ` ${JSON.stringify(metadata)}` : '');

  // Output based on level
  if (level === 'ERROR') {
    console.error(formattedLog);
  } else if (level === 'WARN') {
    console.warn(formattedLog);
  } else if (level === 'DEBUG') {
    if (process.env.DEBUG === 'true') {
      console.debug(formattedLog);
    }
  } else {
    console.log(formattedLog);
  }

  // Optional: Write to file or external logging service
  // writeToLogFile(entry);
  // sendToElk(entry);
}

/**
 * Convenience logger class for container-specific logging
 *
 * @example
 * ```typescript
 * const logger = new ContainerLogger('C-007');
 * logger.info('Request started', { requestId: '123' });
 * logger.warn('Slow response', { duration: 2500 });
 * logger.error('Request failed', { error: err.message });
 * ```
 */
export class ContainerLogger {
  constructor(private containerId: ContainerID) {}

  info(message: string, metadata?: LogMetadata): void {
    log(this.containerId, 'INFO', message, metadata);
  }

  warn(message: string, metadata?: LogMetadata): void {
    log(this.containerId, 'WARN', message, metadata);
  }

  error(message: string, metadata?: LogMetadata): void {
    log(this.containerId, 'ERROR', message, metadata);
  }

  debug(message: string, metadata?: LogMetadata): void {
    log(this.containerId, 'DEBUG', message, metadata);
  }
}

/**
 * Create a logger instance for a specific container
 *
 * @example
 * ```typescript
 * const logger = createLogger('C-008');
 * logger.info('Validation started');
 * ```
 */
export function createLogger(containerId: ContainerID): ContainerLogger {
  return new ContainerLogger(containerId);
}

/**
 * Performance timing logger
 *
 * @example
 * ```typescript
 * const timer = logTiming('C-008', 'Code validation');
 * // ... do work ...
 * timer.end({ files: 5, issues: 2 });
 * ```
 */
export function logTiming(containerId: ContainerID, operation: string) {
  const startTime = Date.now();
  log(containerId, 'DEBUG', `${operation} started`);

  return {
    end: (metadata?: LogMetadata) => {
      const duration = Date.now() - startTime;
      log(containerId, 'INFO', `${operation} completed`, {
        durationMs: duration,
        ...metadata
      });
    }
  };
}

/**
 * Batch log multiple entries (useful for summaries)
 *
 * @example
 * ```typescript
 * logBatch('C-008', [
 *   { level: 'INFO', message: 'Stage 1 complete', metadata: { score: 0.9 } },
 *   { level: 'WARN', message: 'Stage 2 has issues', metadata: { issues: 3 } },
 *   { level: 'INFO', message: 'Overall score', metadata: { score: 0.85 } }
 * ]);
 * ```
 */
export function logBatch(
  containerId: ContainerID,
  entries: Array<{ level: LogLevel; message: string; metadata?: LogMetadata }>
): void {
  entries.forEach(entry => {
    log(containerId, entry.level, entry.message, entry.metadata);
  });
}

/**
 * Export structured logs to JSON (for log aggregation systems)
 */
export function exportJSON(
  containerId: ContainerID,
  level: LogLevel,
  message: string,
  metadata?: LogMetadata
): string {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    containerId,
    level,
    message,
    metadata
  };
  return JSON.stringify(entry);
}
