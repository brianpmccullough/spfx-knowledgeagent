import { LambdaEvent } from "../types/index.js";

/**
 * Extract request context information
 */
export function extractRequestContext(event: LambdaEvent): {
  requestId: string;
  method: string;
  path: string;
  timestamp: string;
  sourceIp: string;
} {
  return {
    requestId: event.requestContext.requestId,
    method: event.httpMethod,
    path: event.path,
    timestamp: new Date(event.requestContext.requestTimeEpoch).toISOString(),
    sourceIp: event.requestContext.identity.sourceIp,
  };
}

/**
 * Extract Bearer token from Authorization header
 */
export function extractBearerToken(authHeader?: string): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(" ");
  if (parts.length === 2 && parts[0].toLowerCase() === "bearer") {
    return parts[1];
  }
  return null;
}

/**
 * Get request body as parsed JSON
 */
export function getRequestBody(event: LambdaEvent): Record<string, any> | null {
  if (!event.body) return null;
  try {
    const body = event.isBase64Encoded ? Buffer.from(event.body, "base64").toString("utf-8") : event.body;
    return JSON.parse(body);
  } catch {
    return null;
  }
}

/**
 * Format ISO timestamp
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Generate correlation ID
 */
export function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
