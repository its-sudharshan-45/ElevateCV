import { logger } from '../../config/logger.js';
import type { IModelAdapter } from '../core/model.adapter.js';
import { ModelInferenceError } from '../core/model.errors.js';
import type {
  InferenceOptions,
  ModelHandle,
  ModelHealth,
  ModelInput,
  ModelLoadContext,
  ModelManifest,
  ModelOutput,
} from '../core/model.types.js';

export class CustomAdapter implements IModelAdapter {
  readonly library = 'custom';

  canHandle(manifest: ModelManifest): boolean {
    return manifest.architecture.library === 'custom';
  }

  async validate(_manifest: ModelManifest): Promise<void> {
    // Custom models validate internal handlers
  }

  async load(manifest: ModelManifest, context: ModelLoadContext): Promise<ModelHandle> {
    logger.info({ modelId: manifest.id }, 'Loading custom model handler...');

    const handle: ModelHandle = {
      id: manifest.id,
      manifest,
      instance: { type: 'custom-handler', modelId: manifest.id },
      loadedAt: new Date(),
      device: context.device || 'cpu',
      dtype: context.dtype || 'fp32',
      predict: async (input: ModelInput, options?: InferenceOptions) => {
        return this.predict(handle, input, options);
      },
      unload: async () => {
        await this.unload(handle);
      },
      healthCheck: async () => {
        return this.healthCheck(handle);
      },
    };

    return handle;
  }

  async unload(handle: ModelHandle): Promise<void> {
    handle.instance = null;
  }

  async predict(
    handle: ModelHandle,
    input: ModelInput,
    _options?: InferenceOptions,
  ): Promise<ModelOutput> {
    const startTime = Date.now();
    try {
      return {
        raw: { input: input.text, status: 'processed-by-custom-model' },
        text: input.text,
        latencyMs: Date.now() - startTime,
        modelId: handle.id,
        device: handle.device,
      };
    } catch (error) {
      throw new ModelInferenceError(handle.id, error);
    }
  }

  async healthCheck(handle: ModelHandle): Promise<ModelHealth> {
    return {
      modelId: handle.id,
      status: 'Healthy',
      latencyMs: 1,
      lastCheckedAt: new Date().toISOString(),
    };
  }
}

export const customAdapter = new CustomAdapter();
