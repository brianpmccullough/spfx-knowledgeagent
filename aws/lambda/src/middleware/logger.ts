import { LogContext } from "../types/index.js";
import { config } from "../config/index.js";

/**
 * Structured logging to CloudWatch
 */
export class Logger {
  static info(message: string, context: LogContext, data?: Record<string, any>): void {
    console.log(
      JSON.stringify({
        timestamp: context.timestamp,
        level: "INFO",
        requestId: context.requestId,
        operation: context.operation,
        message,
        ...data,
      })
    );
  }

  static warn(message: string, context: LogContext, data?: Record<string, any>): void {
    console.warn(
      JSON.stringify({
        timestamp: context.timestamp,
        level: "WARN",
        requestId: context.requestId,
        operation: context.operation,
        message,
        ...data,
      })
    );
  }

  static error(message: string, context: LogContext, error: Error, data?: Record<string, any>): void {
    console.error(
      JSON.stringify({
        timestamp: context.timestamp,
        level: "ERROR",
        requestId: context.requestId,
        operation: context.operation,
        message,
        errorMessage: error.message,
        errorName: error.name,
        errorStack: config.enableDetailedLogging ? error.stack?.split("\n") : undefined,
        ...data,
      })
    );
  }

  static debug(message: string, context: LogContext, data?: Record<string, any>): void {
    if (config.enableDetailedLogging) {
      console.log(
        JSON.stringify({
          timestamp: context.timestamp,
          level: "DEBUG",
          requestId: context.requestId,
          operation: context.operation,
          message,
          ...data,
        })
      );
    }
  }
}
