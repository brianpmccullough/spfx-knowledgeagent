import { LambdaProxyResponse, ApiError, LogContext } from "../types/index.js";
import { Logger } from "./logger.js";
import { addCorsHeaders } from "./corsMiddleware.js";
import { HTTP_STATUS } from "../utils/constants.js";

/**
 * Wrap async handler with error handling and CORS
 */
export async function withErrorHandler<T extends Record<string, any>>(
  handler: () => Promise<T>,
  context: LogContext
): Promise<LambdaProxyResponse> {
  try {
    const result = await handler();
    return addCorsHeaders(HTTP_STATUS.OK, result);
  } catch (error) {
    if (error instanceof ApiError) {
      Logger.warn(error.message, context, { statusCode: error.statusCode });
      return addCorsHeaders(error.statusCode, {
        error: error.message,
        details: error.details,
      });
    }

    const err = error as Error;
    Logger.error("Unhandled error", context, err);
    return addCorsHeaders(HTTP_STATUS.INTERNAL_ERROR, {
      error: "Internal Server Error",
      requestId: context.requestId,
    });
  }
}

/**
 * Handler for validation errors
 */
export function handleValidationError(context: LogContext, message: string, details?: any): LambdaProxyResponse {
  Logger.warn(`Validation error: ${message}`, context, { details });
  return addCorsHeaders(HTTP_STATUS.BAD_REQUEST, {
    error: message,
    details,
  });
}

/**
 * Handler for authorization errors
 */
export function handleAuthorizationError(context: LogContext, message: string = "Unauthorized"): LambdaProxyResponse {
  Logger.warn(message, context);
  return addCorsHeaders(HTTP_STATUS.UNAUTHORIZED, {
    error: message,
  });
}

/**
 * Handler for not found errors
 */
export function handleNotFoundError(context: LogContext, resource: string): LambdaProxyResponse {
  Logger.warn(`Resource not found: ${resource}`, context);
  return addCorsHeaders(HTTP_STATUS.NOT_FOUND, {
    error: `${resource} not found`,
  });
}
