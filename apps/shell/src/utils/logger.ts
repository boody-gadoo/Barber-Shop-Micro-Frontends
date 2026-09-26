/**
 * Logger utility for the shell application
 * Can be extended later for centralized logging/monitoring
 */

enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: unknown;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private log(level: LogLevel, message: string, data?: unknown): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
    };

    const output = this.formatLog(entry);

    // Console output
    switch (level) {
      case LogLevel.DEBUG:
        if (this.isDevelopment) console.debug(output, data);
        break;
      case LogLevel.INFO:
        console.info(output, data);
        break;
      case LogLevel.WARN:
        console.warn(output, data);
        break;
      case LogLevel.ERROR:
        console.error(output, data);
        break;
    }

    // Later: Send to centralized logging service
    // await this.sendToLoggingService(entry);
  }

  private formatLog(entry: LogEntry): string {
    return `[${entry.timestamp}] [${entry.level}] ${entry.message}`;
  }

  debug(message: string, data?: unknown): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  info(message: string, data?: unknown): void {
    this.log(LogLevel.INFO, message, data);
  }

  warn(message: string, data?: unknown): void {
    this.log(LogLevel.WARN, message, data);
  }

  error(message: string, data?: unknown): void {
    this.log(LogLevel.ERROR, message, data);
  }
}

export const logger = new Logger();
