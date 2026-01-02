/**
 * Logger Utility
 *
 * Provides debug-toggleable logging to replace console.log statements.
 * In production, only warnings and errors are shown unless debug mode is enabled.
 */

/** Log levels as const object (avoids enum syntax for erasableSyntaxOnly) */
export const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4,
} as const;

export type LogLevel = (typeof LogLevel)[keyof typeof LogLevel];

/** Logger configuration */
interface LoggerConfig {
  /** Current log level */
  level: LogLevel;
  /** Prefix for all log messages */
  prefix: string;
  /** Whether to include timestamps */
  timestamps: boolean;
}

/** Default configuration */
const defaultConfig: LoggerConfig = {
  level: process.env.NODE_ENV === 'production' ? LogLevel.WARN : LogLevel.DEBUG,
  prefix: '[DQM]',
  timestamps: false,
};

/** Current configuration */
let config: LoggerConfig = { ...defaultConfig };

/** LocalStorage key for debug mode */
const DEBUG_MODE_KEY = 'dqm_debug';

/**
 * Check if debug mode is enabled via localStorage
 */
function isDebugEnabled(): boolean {
  try {
    return localStorage.getItem(DEBUG_MODE_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Get effective log level (considering debug mode override)
 */
function getEffectiveLevel(): LogLevel {
  if (isDebugEnabled()) {
    return LogLevel.DEBUG;
  }
  return config.level;
}

/**
 * Format log message with prefix and optional timestamp
 */
function formatMessage(level: string, args: unknown[]): unknown[] {
  const parts: unknown[] = [];

  if (config.timestamps) {
    parts.push(`[${new Date().toISOString()}]`);
  }

  parts.push(config.prefix);
  parts.push(`[${level}]`);

  return [...parts, ...args];
}

/**
 * Logger object with level-specific methods
 */
export const logger = {
  /**
   * Log debug message (only in development or when debug mode is enabled)
   */
  debug(...args: unknown[]): void {
    if (getEffectiveLevel() <= LogLevel.DEBUG) {
      console.debug(...formatMessage('DEBUG', args));
    }
  },

  /**
   * Log info message
   */
  info(...args: unknown[]): void {
    if (getEffectiveLevel() <= LogLevel.INFO) {
      console.info(...formatMessage('INFO', args));
    }
  },

  /**
   * Log warning message
   */
  warn(...args: unknown[]): void {
    if (getEffectiveLevel() <= LogLevel.WARN) {
      console.warn(...formatMessage('WARN', args));
    }
  },

  /**
   * Log error message
   */
  error(...args: unknown[]): void {
    if (getEffectiveLevel() <= LogLevel.ERROR) {
      console.error(...formatMessage('ERROR', args));
    }
  },

  /**
   * Log with custom level
   */
  log(level: LogLevel, ...args: unknown[]): void {
    if (getEffectiveLevel() <= level) {
      const levelName = LogLevel[level];
      console.log(...formatMessage(levelName, args));
    }
  },

  /**
   * Create a group of related logs (collapsed in console)
   */
  group(label: string): void {
    if (getEffectiveLevel() <= LogLevel.DEBUG) {
      console.groupCollapsed(`${config.prefix} ${label}`);
    }
  },

  /**
   * End a log group
   */
  groupEnd(): void {
    if (getEffectiveLevel() <= LogLevel.DEBUG) {
      console.groupEnd();
    }
  },

  /**
   * Log a table (useful for arrays and objects)
   */
  table(data: unknown, columns?: string[]): void {
    if (getEffectiveLevel() <= LogLevel.DEBUG) {
      console.table(data, columns);
    }
  },

  /**
   * Time a operation
   */
  time(label: string): void {
    if (getEffectiveLevel() <= LogLevel.DEBUG) {
      console.time(`${config.prefix} ${label}`);
    }
  },

  /**
   * End timing and log duration
   */
  timeEnd(label: string): void {
    if (getEffectiveLevel() <= LogLevel.DEBUG) {
      console.timeEnd(`${config.prefix} ${label}`);
    }
  },

  /**
   * Configure logger
   */
  configure(newConfig: Partial<LoggerConfig>): void {
    config = { ...config, ...newConfig };
  },

  /**
   * Reset to default configuration
   */
  reset(): void {
    config = { ...defaultConfig };
  },

  /**
   * Enable debug mode (persists in localStorage)
   */
  enableDebug(): void {
    try {
      localStorage.setItem(DEBUG_MODE_KEY, 'true');
      console.info(`${config.prefix} Debug mode enabled`);
    } catch {
      console.warn(`${config.prefix} Could not persist debug mode to localStorage`);
    }
  },

  /**
   * Disable debug mode
   */
  disableDebug(): void {
    try {
      localStorage.removeItem(DEBUG_MODE_KEY);
      console.info(`${config.prefix} Debug mode disabled`);
    } catch {
      // Ignore
    }
  },

  /**
   * Check if debug mode is enabled
   */
  isDebugEnabled,

  /**
   * Get current log level
   */
  getLevel(): LogLevel {
    return getEffectiveLevel();
  },

  /**
   * Set log level
   */
  setLevel(level: LogLevel): void {
    config.level = level;
  },
};

/**
 * Create a scoped logger with a custom prefix
 */
export function createLogger(scope: string): typeof logger {
  const scopedPrefix = `${config.prefix}[${scope}]`;

  return {
    ...logger,
    debug(...args: unknown[]): void {
      if (getEffectiveLevel() <= LogLevel.DEBUG) {
        console.debug(scopedPrefix, ...args);
      }
    },
    info(...args: unknown[]): void {
      if (getEffectiveLevel() <= LogLevel.INFO) {
        console.info(scopedPrefix, ...args);
      }
    },
    warn(...args: unknown[]): void {
      if (getEffectiveLevel() <= LogLevel.WARN) {
        console.warn(scopedPrefix, ...args);
      }
    },
    error(...args: unknown[]): void {
      if (getEffectiveLevel() <= LogLevel.ERROR) {
        console.error(scopedPrefix, ...args);
      }
    },
    group(label: string): void {
      if (getEffectiveLevel() <= LogLevel.DEBUG) {
        console.groupCollapsed(`${scopedPrefix} ${label}`);
      }
    },
  };
}

export default logger;
