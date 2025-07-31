/**
 * Development-only logger that removes console statements in production builds
 */

const isDev = import.meta.env.DEV;

interface Logger {
  log: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  debug: (...args: unknown[]) => void;
  group: (label?: string) => void;
  groupEnd: () => void;
  time: (label?: string) => void;
  timeEnd: (label?: string) => void;
  table: (data?: unknown, columns?: string[]) => void;
  trace: (...args: unknown[]) => void;
}

/**
 * Development logger that only logs in development mode
 */
export const devLog: Logger = {
  log: (...args: unknown[]) => {
    if (isDev) {
      console.log(...args);
    }
  },

  error: (...args: unknown[]) => {
    if (isDev) {
      console.error(...args);
    }
  },

  warn: (...args: unknown[]) => {
    if (isDev) {
      console.warn(...args);
    }
  },

  info: (...args: unknown[]) => {
    if (isDev) {
      console.info(...args);
    }
  },

  debug: (...args: unknown[]) => {
    if (isDev) {
      console.debug(...args);
    }
  },

  group: (label?: string) => {
    if (isDev) {
      console.group(label);
    }
  },

  groupEnd: () => {
    if (isDev) {
      console.groupEnd();
    }
  },

  time: (label?: string) => {
    if (isDev) {
      console.time(label);
    }
  },

  timeEnd: (label?: string) => {
    if (isDev) {
      console.timeEnd(label);
    }
  },

  table: (data?: unknown, columns?: string[]) => {
    if (isDev) {
      console.table(data, columns);
    }
  },

  trace: (...args: unknown[]) => {
    if (isDev) {
      console.trace(...args);
    }
  },
};

/**
 * Production logger for critical errors that should always be logged
 */
export const prodLog = {
  error: (...args: unknown[]) => {
    console.error(...args);
    // In production, you might want to send this to an error tracking service
  },

  warn: (...args: unknown[]) => {
    console.warn(...args);
  },
};

/**
 * Conditional logger based on a feature flag or condition
 */
export const conditionalLog = (condition: boolean | (() => boolean)) => ({
  log: (...args: unknown[]) => {
    const shouldLog = typeof condition === "function" ? condition() : condition;
    if (shouldLog && isDev) {
      console.log(...args);
    }
  },
});

/**
 * Tagged logger for specific modules
 */
export const createLogger = (tag: string): Logger => ({
  log: (...args: unknown[]) => devLog.log(`[${tag}]`, ...args),
  error: (...args: unknown[]) => devLog.error(`[${tag}]`, ...args),
  warn: (...args: unknown[]) => devLog.warn(`[${tag}]`, ...args),
  info: (...args: unknown[]) => devLog.info(`[${tag}]`, ...args),
  debug: (...args: unknown[]) => devLog.debug(`[${tag}]`, ...args),
  group: (label?: string) =>
    devLog.group(label ? `[${tag}] ${label}` : `[${tag}]`),
  groupEnd: () => devLog.groupEnd(),
  time: (label?: string) =>
    devLog.time(label ? `[${tag}] ${label}` : `[${tag}]`),
  timeEnd: (label?: string) =>
    devLog.timeEnd(label ? `[${tag}] ${label}` : `[${tag}]`),
  table: (data?: unknown, columns?: string[]) => devLog.table(data, columns),
  trace: (...args: unknown[]) => devLog.trace(`[${tag}]`, ...args),
});

// Export a default logger
export default devLog;
