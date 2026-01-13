/**
 * HTTP Headers
 */
export const HTTP_HEADERS = {
  CONTENT_TYPE: "Content-Type",
  AUTHORIZATION: "Authorization",
  BEARER: "Bearer",
} as const;

/**
 * Content Types
 */
export const CONTENT_TYPES = {
  JSON: "application/json",
  TEXT: "text/plain",
} as const;

/**
 * CORS Headers
 */
export const CORS_HEADERS = {
  ALLOW_ORIGIN: "Access-Control-Allow-Origin",
  ALLOW_METHODS: "Access-Control-Allow-Methods",
  ALLOW_HEADERS: "Access-Control-Allow-Headers",
  ALLOW_CREDENTIALS: "Access-Control-Allow-Credentials",
  MAX_AGE: "Access-Control-Max-Age",
} as const;

/**
 * HTTP Methods
 */
export const HTTP_METHODS = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  DELETE: "DELETE",
  PATCH: "PATCH",
  OPTIONS: "OPTIONS",
} as const;

/**
 * HTTP Status Codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

/**
 * Microsoft Graph API
 */
export const GRAPH_API = {
  BASE_URL: "https://graph.microsoft.com/v1.0",
  ME_ENDPOINT: "/me",
  USERS_ENDPOINT: "/users",
} as const;

/**
 * SharePoint REST API
 */
export const SHAREPOINT_API = {
  REST_ENDPOINT: "/_api",
} as const;
