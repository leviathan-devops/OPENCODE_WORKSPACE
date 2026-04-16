type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

let currentLevel: LogLevel = 'info';

export function setLogLevel(level: LogLevel): void {
  currentLevel = level;
}

function formatTimestamp(): string {
  return new Date().toISOString();
}

function log(level: LogLevel, message: string, meta?: object): void {
  if (LOG_LEVELS[level] < LOG_LEVELS[currentLevel]) {
    return;
  }

  const prefix = `[${formatTimestamp()}] [${level.toUpperCase()}]`;

  if (meta) {
    console.log(`${prefix} [AgentCliTools] ${message}`, meta);
  } else {
    console.log(`${prefix} [AgentCliTools] ${message}`);
  }
}

export const logger = {
  debug: (msg: string, meta?: object) => log('debug', msg, meta),
  info: (msg: string, meta?: object) => log('info', msg, meta),
  warn: (msg: string, meta?: object) => log('warn', msg, meta),
  error: (msg: string, meta?: object) => log('error', msg, meta),
};
