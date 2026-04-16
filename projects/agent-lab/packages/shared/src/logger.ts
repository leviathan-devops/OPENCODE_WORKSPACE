export interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  data?: Record<string, any>;
  pod?: string;
}

export class Logger {
  private pod: string;

  constructor(pod: string) {
    this.pod = pod;
  }

  debug(message: string, data?: Record<string, any>) {
    this.log('debug', message, data);
  }

  info(message: string, data?: Record<string, any>) {
    this.log('info', message, data);
  }

  warn(message: string, data?: Record<string, any>) {
    this.log('warn', message, data);
  }

  error(message: string, data?: Record<string, any>) {
    this.log('error', message, data);
  }

  private log(level: LogEntry['level'], message: string, data?: Record<string, any>) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      pod: this.pod
    };

    const json = JSON.stringify(entry);
    
    switch (level) {
      case 'error':
        console.error(json);
        break;
      case 'warn':
        console.warn(json);
        break;
      case 'info':
        console.info(json);
        break;
      case 'debug':
        console.debug(json);
        break;
    }
  }
}

export function createLogger(pod: string): Logger {
  return new Logger(pod);
}