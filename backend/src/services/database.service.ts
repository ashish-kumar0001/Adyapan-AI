import { env } from "../config/env";
import { httpError } from "../utils/httpError";

const NEON_API_BASE = "https://console.neon.tech/api/v2";

interface NeonDatabase {
  id: number;
  branch_id: string;
  name: string;
  owner_name: string;
  created_at: string;
  updated_at: string;
}

interface NeonOperation {
  id: string;
  project_id: string;
  branch_id: string;
  endpoint_id: string;
  action: string;
  status: string;
  failures_count: number;
  created_at: string;
  updated_at: string;
  total_duration_ms: number;
}

interface CreateDatabaseResponse {
  database: NeonDatabase;
  operations: NeonOperation[];
}

interface NeonEndpoint {
  id: string;
  project_id: string;
  branch_id: string;
  host: string;
  proxy_host?: string;
}

class DatabaseService {
  private apiKey: string;
  private projectId: string;
  private branchId: string;

  constructor() {
    this.apiKey = env.neon.apiKey;
    this.projectId = env.neon.projectId;
    this.branchId = env.neon.branchId;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const url = `${NEON_API_BASE}${path}`;
    const headers: Record<string, string> = {
      Accept: "application/json",
      Authorization: `Bearer ${this.apiKey}`,
    };

    if (body) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw httpError(
        response.status,
        `Neon API error: ${error.message || response.statusText}`
      );
    }

    return response.json() as Promise<T>;
  }

  async createDatabase(dbName: string): Promise<NeonDatabase> {
    const response = await this.request<CreateDatabaseResponse>(
      "POST",
      `/projects/${this.projectId}/branches/${this.branchId}/databases`,
      {
        database: {
          name: dbName,
          owner_name: "neondb_owner",
        },
      }
    );
    return response.database;
  }

  async deleteDatabase(databaseId: number): Promise<void> {
    await this.request(
      "DELETE",
      `/projects/${this.projectId}/branches/${this.branchId}/databases/${databaseId}`
    );
  }

  async listDatabases(): Promise<NeonDatabase[]> {
    const response = await this.request<{ databases: NeonDatabase[] }>(
      "GET",
      `/projects/${this.projectId}/branches/${this.branchId}/databases`
    );
    return response.databases;
  }

  async getEndpoint(): Promise<NeonEndpoint> {
    const response = await this.request<{ endpoints: NeonEndpoint[] }>(
      "GET",
      `/projects/${this.projectId}/branches/${this.branchId}/endpoints`
    );
    return response.endpoints[0];
  }

  async getConnectionString(dbName: string): Promise<string> {
    const endpoint = await this.getEndpoint();
    const baseUrl = env.databaseUrl;
    if (!baseUrl) {
      throw httpError(500, "DATABASE_URL is not configured");
    }
    const url = new URL(baseUrl);
    url.pathname = `/${dbName}`;
    return url.toString();
  }

  async checkDatabaseExists(dbName: string): Promise<boolean> {
    const databases = await this.listDatabases();
    return databases.some((db) => db.name === dbName);
  }

  async getDatabaseUrlForUser(userId: string): Promise<string> {
    const dbName = `user_${userId}`;
    const exists = await this.checkDatabaseExists(dbName);
    if (!exists) {
      throw httpError(404, `Database not found for user: ${userId}`);
    }
    return this.getConnectionString(dbName);
  }

  async getUserDatabaseInfo(userId: string): Promise<NeonDatabase | null> {
    const dbName = `user_${userId}`;
    const databases = await this.listDatabases();
    return databases.find((db) => db.name === dbName) || null;
  }

  async waitForOperation(
    operationId: string,
    maxAttempts = 30,
    delayMs = 1000
  ): Promise<NeonOperation> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const response = await this.request<{ operations: NeonOperation[] }>(
        "GET",
        `/projects/${this.projectId}/operations`
      );
      const operation = response.operations.find(
        (op) => op.id === operationId
      );
      if (operation && operation.status !== "running") {
        return operation;
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
    throw httpError(408, "Operation timed out");
  }
}

export const databaseService = new DatabaseService();