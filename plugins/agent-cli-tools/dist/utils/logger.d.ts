/**
 * src/utils/logger.ts
 *
 * Observable logging utility - Agent CLI Tools pattern.
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export declare function setLogLevel(level: LogLevel): void;
export declare function debug(message: string, meta?: Record<string, unknown>): void;
export declare function info(message: string, meta?: Record<string, unknown>): void;
export declare function warn(message: string, meta?: Record<string, unknown>): void;
export declare function error(message: string, meta?: Record<string, unknown>): void;
export declare function createLogger(prefix: string): {
    debug: (msg: string, meta?: Record<string, unknown>) => void;
    info: (msg: string, meta?: Record<string, unknown>) => void;
    warn: (msg: string, meta?: Record<string, unknown>) => void;
    error: (msg: string, meta?: Record<string, unknown>) => void;
};
export declare const logger: {
    debug: (msg: string, meta?: Record<string, unknown>) => void;
    info: (msg: string, meta?: Record<string, unknown>) => void;
    warn: (msg: string, meta?: Record<string, unknown>) => void;
    error: (msg: string, meta?: Record<string, unknown>) => void;
};
//# sourceMappingURL=logger.d.ts.map