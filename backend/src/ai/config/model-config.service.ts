import { z } from 'zod';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import type { ModelManifest } from '../core/model.types.js';

export const runtimeConfigSchema = z.object({
  device: z.enum(['cpu', 'cuda', 'mps', 'webgpu', 'wasm', 'auto']).default('auto'),
  dtype: z.string().default('fp32'),
  quantization: z.enum(['fp32', 'fp16', 'bf16', 'int8', '4-bit', 'q4', 'q8', 'auto']).default('auto'),
  maxBatchSize: z.number().int().positive().default(16),
  timeoutMs: z.number().int().positive().default(30_000),
  hfCacheDir: z.string().default('.cache/huggingface'),
});

export type RuntimeConfig = z.infer<typeof runtimeConfigSchema>;

export class ModelConfigService {
  private readonly configCache = new Map<string, RuntimeConfig>();

  /**
   * Resolves hierarchical configuration:
   * HF Defaults -> Manifest Config -> App Config -> Environment Variables -> Runtime Overrides
   */
  resolveConfiguration(
    manifest?: ModelManifest,
    runtimeOverrides?: Partial<RuntimeConfig>,
  ): RuntimeConfig {
    const cacheKey = `${manifest?.id ?? 'global'}-${JSON.stringify(runtimeOverrides ?? {})}`;
    const cached = this.configCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const rawConfig = {
      device: runtimeOverrides?.device || manifest?.runtime.device || 'auto',
      dtype: runtimeOverrides?.dtype || manifest?.runtime.dtype || 'fp32',
      quantization: runtimeOverrides?.quantization || manifest?.runtime.quantization || 'auto',
      maxBatchSize: runtimeOverrides?.maxBatchSize || manifest?.runtime.maxBatchSize || 16,
      timeoutMs: runtimeOverrides?.timeoutMs || env.AI_TIMEOUT_MS || 30_000,
      hfCacheDir: env.HF_CACHE_DIR || '.cache/huggingface',
    };

    const validated = runtimeConfigSchema.parse(rawConfig);
    this.configCache.set(cacheKey, validated);
    logger.debug({ modelId: manifest?.id }, 'Resolved hierarchical model configuration');
    return validated;
  }

  clearCache(): void {
    this.configCache.clear();
  }
}

export const modelConfigService = new ModelConfigService();
