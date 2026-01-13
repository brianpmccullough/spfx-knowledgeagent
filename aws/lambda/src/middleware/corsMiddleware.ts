import { LambdaProxyResponse } from "../types/index.js";
import { config } from "../config/index.js";
import { CORS_HEADERS, CONTENT_TYPES, HTTP_METHODS } from "../utils/constants.js";

/**
 * Add CORS headers to Lambda response
 */
export function addCorsHeaders(statusCode: number = 200, body: Record<string, any> = {}): LambdaProxyResponse {
  return {
    statusCode,
    headers: {
      [CORS_HEADERS.ALLOW_ORIGIN]: config.spfxOrigin,
      [CORS_HEADERS.ALLOW_METHODS]: `${HTTP_METHODS.GET},${HTTP_METHODS.POST},${HTTP_METHODS.PUT},${HTTP_METHODS.DELETE},${HTTP_METHODS.PATCH},${HTTP_METHODS.OPTIONS}`,
      [CORS_HEADERS.ALLOW_HEADERS]: "Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token",
      [CORS_HEADERS.ALLOW_CREDENTIALS]: "true",
      [CORS_HEADERS.MAX_AGE]: "86400", // 24 hours
      "Content-Type": CONTENT_TYPES.JSON,
    },
    body: JSON.stringify(body),
    isBase64Encoded: false,
  };
}

/**
 * Handle preflight OPTIONS request
 */
export function handlePreflight(): LambdaProxyResponse {
  return addCorsHeaders(200, { message: "OK" });
}
