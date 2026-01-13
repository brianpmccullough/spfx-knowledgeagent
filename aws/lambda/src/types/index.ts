/**
 * Lambda Proxy Response interface for API Gateway
 */
export interface LambdaProxyResponse {
  statusCode: number;
  headers: {
    "Content-Type": string;
    "Access-Control-Allow-Origin": string;
    "Access-Control-Allow-Methods": string;
    "Access-Control-Allow-Headers": string;
    "Access-Control-Allow-Credentials"?: string;
    "Access-Control-Max-Age"?: string;
    [key: string]: string | undefined;
  };
  body: string;
  isBase64Encoded?: boolean;
}

/**
 * Lambda Event from API Gateway
 */
export interface LambdaEvent {
  resource: string;
  path: string;
  httpMethod: string;
  headers: Record<string, string>;
  multiValueHeaders?: Record<string, string[]>;
  queryStringParameters?: Record<string, string> | null;
  multiValueQueryStringParameters?: Record<string, string[]> | null;
  pathParameters?: Record<string, string> | null;
  stageVariables?: Record<string, string> | null;
  requestContext: {
    accountId: string;
    apiId: string;
    protocol: string;
    httpMethod: string;
    path: string;
    stage: string;
    requestId: string;
    requestTime: string;
    requestTimeEpoch: number;
    identity: {
      sourceIp: string;
      userAgent: string;
      [key: string]: any;
    };
    [key: string]: any;
  };
  body?: string | null;
  isBase64Encoded?: boolean;
}

/**
 * Logging context for structured logging
 */
export interface LogContext {
  requestId: string;
  operation: string;
  timestamp: string;
  userId?: string;
  path?: string;
  method?: string;
}

/**
 * Custom API error
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = "ApiError";
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}
