import { logger } from '../../config/logger.js';
import { adapterRegistry, type AdapterRegistry } from '../adapters/adapter-registry.js';
import { customAdapter } from '../adapters/custom.adapter.js';
import { diffusersAdapter } from '../adapters/diffusers.adapter.js';
import { sentenceTransformersAdapter } from '../adapters/sentence-transformers.adapter.js';
import { timmAdapter } from '../adapters/timm.adapter.js';
import { transformersAdapter } from '../adapters/transformers.adapter.js';
import { ModelNotFoundError, ModelSecurityError } from '../core/model.errors.js';
import type {
  ModelHandle,
  ModelLoadContext,
  QuantizationMethod,
} from '../core/model.types.js';
import { modelRegistry, type ModelRegistry } from '../registry/model-registry.js';
import { deviceManager, type DeviceManager } from '../runtime/device-manager.js';
import { memoryManager, type MemoryManager } from '../runtime/memory-manager.js';
import { quantizationManager, type QuantizationManager } from '../runtime/quantization-manager.js';

export class ModelFactory {
  private readonly loadedModels = new Map<string, ModelHandle>();
  private readonly loadLocks = new Map<string, Promise<ModelHandle>>();

  constructor(
    private readonly registry: ModelRegistry = modelRegistry,
    private readonly adapters: AdapterRegistry = adapterRegistry,
    private readonly devices: DeviceManager = deviceManager,
    private readonly memory: MemoryManager = memoryManager,
    private readonly quantization: QuantizationManager = quantizationManager,
  ) {
    this.registerDefaultAdapters();
  }

  private registerDefaultAdapters(): void {
    if (!this.adapters.get('transformers')) {
      this.adapters.register(transformersAdapter);
    }
    if (!this.adapters.get('sentence-transformers')) {
      this.adapters.register(sentenceTransformersAdapter);
    }
    if (!this.adapters.get('diffusers')) {
      this.adapters.register(diffusersAdapter);
    }
    if (!this.adapters.get('timm')) {
      this.adapters.register(timmAdapter);
    }
    if (!this.adapters.get('custom')) {
      this.adapters.register(customAdapter);
    }
  }

  async load(
    modelId: string,
    contextOverrides?: Partial<ModelLoadContext>,
  ): Promise<ModelHandle> {
    // 1. Check if model is already loaded and cached
    const cached = this.loadedModels.get(modelId);
    if (cached && cached.instance) {
      logger.debug({ modelId }, 'Returning cached model handle');
      return cached;
    }

    // 2. Prevent duplicate concurrent initialization using load locks
    const existingLock = this.loadLocks.get(modelId);
    if (existingLock) {
      logger.info({ modelId }, 'Model is currently loading in another request. Awaiting lock...');
      return existingLock;
    }

    // 3. Create load lock promise
    const loadPromise = (async () => {
      try {
        // 4. Registry lookup
        const manifest = this.registry.get(modelId);
        if (!manifest) {
          throw new ModelNotFoundError(modelId);
        }

        // 5. Security check
        if (!manifest.security.allowlisted && manifest.status !== 'active') {
          throw new ModelSecurityError(modelId, 'Model is not allowlisted or active in production registry');
        }

        // 6. Adapter selection
        const adapter = this.adapters.findAdapterForManifest(manifest);

        // 7. Device detection & resolution
        const targetDevice = this.devices.resolveTargetDevice(
          contextOverrides?.device || manifest.runtime.device,
        );

        // 8. Memory check & OOM protection
        this.memory.ensureCanLoad(manifest, targetDevice);

        // 9. Quantization resolution
        const resolvedQuant = this.quantization.resolveQuantization(
          manifest,
          contextOverrides?.quantization,
        );

        const loadContext: ModelLoadContext = {
          device: targetDevice,
          dtype: manifest.runtime.dtype || 'fp32',
          quantization: typeof resolvedQuant === 'string' ? (resolvedQuant as QuantizationMethod) : manifest.runtime.quantization,
          ...contextOverrides,
        };

        // 10. Load model via adapter
        logger.info(
          { modelId, library: manifest.architecture.library, device: targetDevice },
          'ModelFactory initializing model via adapter...',
        );

        const handle = await adapter.load(manifest, loadContext);

        // 11. Run health check
        const health = await handle.healthCheck();
        if (health.status === 'Failed') {
          logger.warn({ modelId, health }, 'Model loaded with health failure status');
        }

        // 12. Store in cache
        this.loadedModels.set(modelId, handle);
        return handle;
      } finally {
        this.loadLocks.delete(modelId);
      }
    })();

    this.loadLocks.set(modelId, loadPromise);
    return loadPromise;
  }

  async unload(modelId: string): Promise<boolean> {
    const handle = this.loadedModels.get(modelId);
    if (!handle) {
      return false;
    }

    try {
      await handle.unload();
    } catch (err) {
      logger.warn({ modelId, err }, 'Error during model unload');
    }

    this.loadedModels.delete(modelId);
    return true;
  }

  async unloadAll(): Promise<void> {
    const ids = Array.from(this.loadedModels.keys());
    for (const id of ids) {
      await this.unload(id);
    }
  }

  isLoaded(modelId: string): boolean {
    const handle = this.loadedModels.get(modelId);
    return Boolean(handle && handle.instance);
  }

  getLoadedModels(): ModelHandle[] {
    return Array.from(this.loadedModels.values());
  }
}

export const modelFactory = new ModelFactory();
