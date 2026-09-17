import { logger } from '../../config/logger.js';
import type { ModelHealth } from '../core/model.types.js';
import { modelFactory, type ModelFactory } from '../factory/model-factory.js';
import { hfHubService, type HfHubService } from '../hub/hf-hub.service.js';
import { modelRegistry, type ModelRegistry } from '../registry/model-registry.js';

export class ModelHealthService {
  constructor(
    private readonly registry: ModelRegistry = modelRegistry,
    private readonly factory: ModelFactory = modelFactory,
    private readonly hub: HfHubService = hfHubService,
  ) {}

  async checkModelHealth(modelId: string): Promise<ModelHealth> {
    const manifest = this.registry.get(modelId);
    if (!manifest) {
      return {
        modelId,
        status: 'Unavailable',
        lastCheckedAt: new Date().toISOString(),
        error: 'Model not found in registry',
      };
    }

    if (manifest.status === 'deprecated') {
      return {
        modelId,
        status: 'Deprecated',
        lastCheckedAt: new Date().toISOString(),
        details: { note: 'Model is marked deprecated' },
      };
    }

    try {
      // Check if instance is loaded
      if (this.factory.isLoaded(modelId)) {
        const handle = await this.factory.load(modelId);
        return await handle.healthCheck();
      }

      // Check hub connectivity
      const hubMeta = await this.hub.getModelMetadata(manifest.hub.modelId);
      if (!hubMeta.isAvailable) {
        return {
          modelId,
          status: 'Degraded',
          lastCheckedAt: new Date().toISOString(),
          details: { hubReachable: false },
        };
      }

      return {
        modelId,
        status: 'Healthy',
        lastCheckedAt: new Date().toISOString(),
        details: { state: 'Ready for loading', hubAvailable: true },
      };
    } catch (error) {
      logger.error({ modelId, error }, 'Health check failed for model');
      return {
        modelId,
        status: 'Failed',
        lastCheckedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async checkAllModels(): Promise<ModelHealth[]> {
    const manifests = this.registry.getAll();
    const results: ModelHealth[] = [];

    for (const manifest of manifests) {
      const health = await this.checkModelHealth(manifest.id);
      results.push(health);
    }

    return results;
  }
}

export const modelHealthService = new ModelHealthService();
