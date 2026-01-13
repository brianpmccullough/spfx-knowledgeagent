import { Logger } from "../middleware/logger.js";
import { LogContext, ApiError } from "../types/index.js";
import { GRAPH_API, HTTP_STATUS } from "../utils/constants.js";

/**
 * Service for Microsoft Graph API interactions
 * Placeholder for service account token handling
 */
export class GraphService {
  /**
   * Get access token for service account
   * @note This is a placeholder - implement after App Registration setup
   */
  private static async getAccessToken(): Promise<string> {
    // TODO: Implement after App Registration setup
    // 1. Retrieve credentials from AWS Secrets Manager
    // 2. Call Azure token endpoint with client credentials flow
    // 3. Cache token with TTL
    throw new ApiError(
      HTTP_STATUS.INTERNAL_ERROR,
      "Service account authentication not yet configured. Set up App Registration first."
    );
  }

  /**
   * Make authenticated request to Microsoft Graph API
   */
  private static async makeGraphRequest<T extends Record<string, any>>(
    method: string,
    endpoint: string,
    context: LogContext,
    body?: Record<string, any>
  ): Promise<T> {
    try {
      const token = await this.getAccessToken();

      const url = `${GRAPH_API.BASE_URL}${endpoint}`;

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        Logger.warn(`Graph API error: ${response.statusText}`, context, {
          endpoint,
          statusCode: response.status,
          errorData,
        });
        throw new ApiError(response.status, `Graph API returned ${response.statusText}`, errorData);
      }

      const data: T = (await response.json()) as T;
      Logger.info(`Graph API call succeeded`, context, { endpoint, method });
      return data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      Logger.error(`Graph API call failed`, context, error as Error, { endpoint, method });
      throw new ApiError(HTTP_STATUS.INTERNAL_ERROR, "Failed to call Microsoft Graph API", {
        endpoint,
        originalError: (error as Error).message,
      });
    }
  }

  /**
   * Get current user information
   */
  static async getCurrentUser(context: LogContext): Promise<any> {
    return this.makeGraphRequest("GET", GRAPH_API.ME_ENDPOINT, context);
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: string, context: LogContext): Promise<any> {
    return this.makeGraphRequest("GET", `${GRAPH_API.USERS_ENDPOINT}/${userId}`, context);
  }

  /**
   * Get user list with filters
   */
  static async listUsers(context: LogContext, filter?: string, top?: number): Promise<any> {
    let endpoint = GRAPH_API.USERS_ENDPOINT;
    const params = [];

    if (filter) {
      params.push(`$filter=${encodeURIComponent(filter)}`);
    }
    if (top) {
      params.push(`$top=${top}`);
    }

    if (params.length > 0) {
      endpoint += `?${params.join("&")}`;
    }

    return this.makeGraphRequest("GET", endpoint, context);
  }
}
