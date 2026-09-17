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

export class DiffusersAdapter implements IModelAdapter {
  readonly library = 'diffusers';

  canHandle(manifest: ModelManifest): boolean {
    return manifest.architecture.library === 'diffusers';
  }

  async validate(manifest: ModelManifest): Promise<void> {
    if (!manifest.hub.modelId) {
      throw new Error(`Diffusers manifest '${manifest.id}' missing hub modelId`);
    }
  }

  async load(manifest: ModelManifest, context: ModelLoadContext): Promise<ModelHandle> {
    await this.validate(manifest);
    logger.info({ modelId: manifest.hub.modelId }, 'Loading Diffusers image generation model...');

    const handle: ModelHandle = {
      id: manifest.id,
      manifest,
      instance: { type: 'diffusers-pipeline', modelId: manifest.hub.modelId },
      loadedAt: new Date(),
      device: context.device || 'cpu',
      dtype: context.dtype || 'fp16',
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
        raw: { status: 'success', prompt: input.prompt },
        generatedImages: [],
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
      latencyMs: 5,
      lastCheckedAt: new Date().toISOString(),
    };
  }
}

export const diffusersAdapter = new DiffusersAdapter();
