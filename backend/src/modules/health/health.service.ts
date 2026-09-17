import { aiService, AiService } from '../../ai/ai.service.js';
import type { AiProviderStatus } from '../../ai/ai.types.js';
import { getSupabaseAdmin } from '../../config/supabase.js';

export type CheckStatus = 'ok' | 'degraded' | 'error';

export interface HealthCheck {
  status: CheckStatus;
  latencyMs?: number;
  error?: string;
}

export interface HealthStatus {
  status: 'ok' | 'degraded';
  service: string;
  version: string;
  timestamp: string;
  uptimeSeconds: number;
  checks: {
    database: HealthCheck;
    aiProviders?: {
      provider: string;
      configured: boolean;
      available: boolean;
      latencyMs?: number;
      error?: string;
    }[];
  };
}

export class HealthService {
  private readonly startedAt = Date.now();

  constructor(private readonly ai: AiService = aiService) {}

  async getStatus(): Promise<HealthStatus> {
    const database = await this.checkDatabase();
    const aiProviders = await this.checkAiProviders();

    return {
      status: database.status === 'ok' ? 'ok' : 'degraded',
      service: 'upskilr-api',
      version: process.env.npm_package_version ?? '0.1.0',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor((Date.now() - this.startedAt) / 1000),
      checks: {
        database,
        aiProviders,
      },
    };
  }

  private async checkAiProviders(): Promise<AiProviderStatus[]> {
    try {
      return await this.ai.checkProviderHealth();
    } catch {
      return [];
    }
  }

  private async checkDatabase(): Promise<HealthCheck> {
    const start = Date.now();
    try {
      const admin = getSupabaseAdmin();
      const { error } = await admin
        .from('profiles')
        .select('id')
        .limit(1)
        .maybeSingle();

      const latencyMs = Date.now() - start;

      if (!error) {
        return { status: 'ok', latencyMs };
      }

      // Fallback check via Supabase Auth service to verify database connectivity
      const authRes = await admin.auth.admin.listUsers({ page: 1, perPage: 1 });
      if (!authRes.error) {
        return { status: 'ok', latencyMs };
      }

      return { status: 'error', latencyMs, error: error.message };
    } catch (err) {
      return {
        status: 'error',
        latencyMs: Date.now() - start,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  }
}

export const healthService = new HealthService();
