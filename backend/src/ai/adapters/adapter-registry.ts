import { logger } from '../../config/logger.js';
import type { IModelAdapter } from '../core/model.adapter.js';
import { ModelCompatibilityError } from '../core/model.errors.js';
import type { ModelManifest } from '../core/model.types.js';

export class AdapterRegistry {
  private readonly adapters = new Map<string, IModelAdapter>();

  register(adapter: IModelAdapter): void {
    this.adapters.set(adapter.library, adapter);
    logger.info({ library: adapter.library }, 'Model adapter registered');
  }

  unregister(library: string): boolean {
    return this.adapters.delete(library);
  }

  get(library: string): IModelAdapter | undefined {
    return this.adapters.get(library);
  }

  findAdapterForManifest(manifest: ModelManifest): IModelAdapter {
    const library = manifest.architecture.library;
    const directAdapter = this.adapters.get(library);

    if (directAdapter && directAdapter.canHandle(manifest)) {
      return directAdapter;
    }

    for (const adapter of this.adapters.values()) {
      if (adapter.canHandle(manifest)) {
        return adapter;
      }
    }

    throw new ModelCompatibilityError(
      manifest.id,
      `No suitable model adapter registered for library '${library}' and task '${manifest.architecture.task}'`,
    );
  }

  getAll(): IModelAdapter[] {
    return Array.from(this.adapters.values());
  }
}

export const adapterRegistry = new AdapterRegistry();
