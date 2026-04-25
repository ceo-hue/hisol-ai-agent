/**
 * ARHA Structured Logger — Vol.A~E Layer Names
 * Replaces legacy C-00X container IDs with ARHA grammar layer identifiers.
 */

export type ARHALayerID =
  | 'Vol.A'       // Identity — persona, P vector, value chain
  | 'Vol.B'       // Cognition — sensor-in, resonance, phase
  | 'Vol.C'       // Narration — sensor-out, sigma style
  | 'Vol.D'       // Execution — state, turn-cycle, bootstrap
  | 'Vol.E'       // Skill / Observation — worktree, analytics, code-validate
  | 'Gateway'     // HTTP API gateway
  | 'MCP'         // MCP server + tools
  | 'Persistence' // Π storage layer
  ;

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

export interface LogMetadata {
  [key: string]: any;
}

export interface LogEntry {
  timestamp: string;
  layer: ARHALayerID;
  level: LogLevel;
  message: string;
  metadata?: LogMetadata;
}

const COLORS: Record<ARHALayerID | LogLevel | 'RESET', string> = {
  'Vol.A':       '\x1b[35m', // Magenta  — Identity
  'Vol.B':       '\x1b[36m', // Cyan     — Cognition
  'Vol.C':       '\x1b[34m', // Blue     — Narration
  'Vol.D':       '\x1b[33m', // Yellow   — Execution
  'Vol.E':       '\x1b[32m', // Green    — Skill/Observe
  'Gateway':     '\x1b[36m', // Cyan     — HTTP
  'MCP':         '\x1b[37m', // White    — MCP
  'Persistence': '\x1b[90m', // Gray     — Π
  'INFO':        '\x1b[37m',
  'WARN':        '\x1b[33m',
  'ERROR':       '\x1b[31m',
  'DEBUG':       '\x1b[90m',
  'RESET':       '\x1b[0m',
};

export function log(
  layer: ARHALayerID,
  level: LogLevel,
  message: string,
  metadata?: LogMetadata
): void {
  const color = COLORS[layer] ?? '';
  const levelColor = COLORS[level] ?? '';
  const reset = COLORS.RESET;

  const label = `[ARHA:${layer}]`;
  const formatted =
    `${color}${label}${reset} ${levelColor}${level}${reset} ${message}` +
    (metadata ? ` ${JSON.stringify(metadata)}` : '');

  if (level === 'ERROR') console.error(formatted);
  else if (level === 'WARN') console.warn(formatted);
  else if (level === 'DEBUG') { if (process.env.DEBUG === 'true') console.debug(formatted); }
  else console.log(formatted);
}

export class ARHALogger {
  constructor(private layer: ARHALayerID) {}
  info(msg: string, meta?: LogMetadata)  { log(this.layer, 'INFO',  msg, meta); }
  warn(msg: string, meta?: LogMetadata)  { log(this.layer, 'WARN',  msg, meta); }
  error(msg: string, meta?: LogMetadata) { log(this.layer, 'ERROR', msg, meta); }
  debug(msg: string, meta?: LogMetadata) { log(this.layer, 'DEBUG', msg, meta); }
}

export function createLogger(layer: ARHALayerID): ARHALogger {
  return new ARHALogger(layer);
}

export function logTiming(layer: ARHALayerID, operation: string) {
  const start = Date.now();
  log(layer, 'DEBUG', `${operation} started`);
  return {
    end: (meta?: LogMetadata) => {
      log(layer, 'INFO', `${operation} completed`, { durationMs: Date.now() - start, ...meta });
    },
  };
}

export function logBatch(
  layer: ARHALayerID,
  entries: Array<{ level: LogLevel; message: string; metadata?: LogMetadata }>
): void {
  entries.forEach(e => log(layer, e.level, e.message, e.metadata));
}
