import { Logger } from "../middleware/logger.js";
import { LogContext, ApiError } from "../types/index.js";
import { SHAREPOINT_API, HTTP_STATUS } from "../utils/constants.js";

/**
 * Service for SharePoint REST API interactions
 * Placeholder for pass-through token handling
 */
export class SharePointService {
  /**
   * Validate token for SharePoint REST API (pass-through from SPFx)
   * @note This is a placeholder - implement token validation after setup
   */
  private static validateToken(token?: string): void {
    // TODO: Implement after setup
    // 1. Validate JWT structure
    // 2. Check token expiration
    // 3. Verify token signature
    // 4. Check required scopes

    if (!token) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "No authorization token provided");
    }
  }

  /**
   * Make authenticated request to SharePoint REST API
   */
  private static async makeSharePointRequest<T extends Record<string, any>>(
    siteUrl: string,
    method: string,
    endpoint: string,
    context: LogContext,
    token?: string,
    body?: Record<string, any>
  ): Promise<T> {
    try {
      if (token) {
        this.validateToken(token);
      }

      const url = `${siteUrl}${SHAREPOINT_API.REST_ENDPOINT}${endpoint}`;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        Logger.warn(`SharePoint API error: ${response.statusText}`, context, {
          endpoint,
          statusCode: response.status,
          errorData,
        });
        throw new ApiError(response.status, `SharePoint API returned ${response.statusText}`, errorData);
      }

      const data: T = (await response.json()) as T;
      Logger.info(`SharePoint API call succeeded`, context, { endpoint, method });
      return data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      Logger.error(`SharePoint API call failed`, context, error as Error, { endpoint, method });
      throw new ApiError(HTTP_STATUS.INTERNAL_ERROR, "Failed to call SharePoint REST API", {
        endpoint,
        originalError: (error as Error).message,
      });
    }
  }

  /**
   * Get list items
   */
  static async getListItems(siteUrl: string, listId: string, context: LogContext, token?: string): Promise<any> {
    return this.makeSharePointRequest(`${siteUrl}`, "GET", `/web/lists('${listId}')/items`, context, token);
  }

  /**
   * Get site information
   */
  static async getSiteInfo(siteUrl: string, context: LogContext, token?: string): Promise<any> {
    return this.makeSharePointRequest(`${siteUrl}`, "GET", "/web", context, token);
  }

  /**
   * Get lists
   */
  static async getLists(siteUrl: string, context: LogContext, token?: string): Promise<any> {
    return this.makeSharePointRequest(`${siteUrl}`, "GET", "/web/lists", context, token);
  }
}
