// Centralized logging utility
export class Logger {
  private static isDevelopment = process.env.NODE_ENV === 'development';

  static info(message: string, ...args: unknown[]) {
    if (this.isDevelopment) {
      console.log(`[INFO] ${message}`, ...args);
    }
  }

  static warn(message: string, ...args: unknown[]) {
    if (this.isDevelopment) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  static error(message: string, ...args: unknown[]) {
    console.error(`[ERROR] ${message}`, ...args);
  }

  static debug(message: string, ...args: unknown[]) {
    if (this.isDevelopment && process.env.DEBUG) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }
}

export const logger = Logger;