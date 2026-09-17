import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';

export interface HubModelMetadata {
  modelId: string;
  author?: string;
  sha?: string;
  lastModified?: string;
  downloads?: number;
  likes?: number;
  tags?: string[];
  isAvailable: boolean;
  libraryName?: string;
}

export class HfHubService {
  private readonly baseUrl = 'https://huggingface.co/api/models';
  private readonly metadataCache = new Map<string, HubModelMetadata>();

  async getModelMetadata(modelId: string): Promise<HubModelMetadata> {
    const cached = this.metadataCache.get(modelId);
    if (cached) {
      return cached;
    }

    try {
      const headers: Record<string, string> = {};
      if (env.HF_TOKEN) {
        headers.Authorization = `Bearer ${env.HF_TOKEN}`;
      }

      const res = await fetch(`${this.baseUrl}/${modelId}`, {
        headers,
        signal: AbortSignal.timeout(10_000),
      });

      if (!res.ok) {
        return {
          modelId,
          isAvailable: false,
        };
      }

      const data = (await res.json()) as Record<string, unknown>;
      const metadata: HubModelMetadata = {
        modelId,
        author: typeof data.author === 'string' ? data.author : undefined,
        sha: typeof data.sha === 'string' ? data.sha : undefined,
        lastModified: typeof data.lastModified === 'string' ? data.lastModified : undefined,
        downloads: typeof data.downloads === 'number' ? data.downloads : undefined,
        likes: typeof data.likes === 'number' ? data.likes : undefined,
        tags: Array.isArray(data.tags) ? (data.tags as string[]) : [],
        isAvailable: true,
        libraryName: typeof data.library_name === 'string' ? data.library_name : undefined,
      };

      this.metadataCache.set(modelId, metadata);
      return metadata;
    } catch (error) {
      logger.warn({ modelId, error }, 'Unable to contact Hugging Face Hub API; returning offline status');
      return {
        modelId,
        isAvailable: false,
      };
    }
  }

  async checkLatestRevision(modelId: string, currentRevision = 'main'): Promise<{
    hasUpdate: boolean;
    latestSha?: string;
    currentRevision: string;
  }> {
    const meta = await this.getModelMetadata(modelId);
    return {
      hasUpdate: Boolean(meta.sha && meta.sha !== currentRevision && currentRevision !== 'main'),
      latestSha: meta.sha,
      currentRevision,
    };
  }
}

export const hfHubService = new HfHubService();
