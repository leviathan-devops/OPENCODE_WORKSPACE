type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export declare function setLogLevel(level: LogLevel): void;
export declare const logger: {
    debug: (msg: string, meta?: object) => void;
    info: (msg: string, meta?: object) => void;
    warn: (msg: string, meta?: object) => void;
    error: (msg: string, meta?: object) => void;
};
export {};
//# sourceMappingURL=logger.d.ts.map