import { LambdaEvent, LambdaProxyResponse, LogContext } from "../types/index.js";
import { handlePreflight, addCorsHeaders } from "../middleware/corsMiddleware.js";
import { Logger } from "../middleware/logger.js";
import { withErrorHandler } from "../middleware/errorHandler.js";
import { extractRequestContext, getCurrentTimestamp } from "../utils/helpers.js";
import { HTTP_METHODS, HTTP_STATUS } from "../utils/constants.js";
import { validateConfig } from "../config/index.js";

/**
 * Main Lambda handler for HTTP API
 */
export async function handler(event: LambdaEvent): Promise<LambdaProxyResponse> {
  // Validate configuration on cold start
  validateConfig();

  // Extract request context
  const requestContext = extractRequestContext(event);
  const context: LogContext = {
    requestId: requestContext.requestId,
    operation: `${requestContext.method} ${requestContext.path}`,
    timestamp: requestContext.timestamp,
  };

  Logger.info("Received request", context, {
    method: requestContext.method,
    path: requestContext.path,
    sourceIp: requestContext.sourceIp,
  });

  // Handle preflight CORS requests
  if (event.httpMethod === HTTP_METHODS.OPTIONS) {
    return handlePreflight();
  }

  // Route requests based on path
  const path = event.path.toLowerCase();

  if (path === "/health") {
    return withErrorHandler(
      async () => ({
        status: "healthy",
        timestamp: getCurrentTimestamp(),
      }),
      context
    );
  }

  if (path.startsWith("/graph")) {
    return handleGraphRequest(event, context);
  }

  if (path.startsWith("/sharepoint")) {
    return handleSharePointRequest(event, context);
  }

  // 404 for unknown routes
  Logger.warn("Route not found", context, { path: event.path });
  return addCorsHeaders(HTTP_STATUS.NOT_FOUND, {
    error: "Route not found",
    path: event.path,
  });
}

/**
 * Handle Graph API requests
 */
async function handleGraphRequest(event: LambdaEvent, context: LogContext): Promise<LambdaProxyResponse> {
  return withErrorHandler(async () => {
    // TODO: Implement Graph API routing
    // - Extract endpoint from path
    // - Validate request
    // - Call GraphService
    // - Return response

    Logger.info("Graph API request received", context);
    return {
      message: "Graph API endpoint - not yet implemented",
      path: event.path,
      hint: "Implement after App Registration setup",
    };
  }, context);
}

/**
 * Handle SharePoint API requests
 */
async function handleSharePointRequest(event: LambdaEvent, context: LogContext): Promise<LambdaProxyResponse> {
  return withErrorHandler(async () => {
    // TODO: Implement SharePoint API routing
    // - Extract siteUrl and endpoint from path/query
    // - Validate authorization
    // - Call SharePointService
    // - Return response

    Logger.info("SharePoint API request received", context);
    return {
      message: "SharePoint API endpoint - not yet implemented",
      path: event.path,
      hint: "Implement after App Registration setup",
    };
  }, context);
}

export default handler;
