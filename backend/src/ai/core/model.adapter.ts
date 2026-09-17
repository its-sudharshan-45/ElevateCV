import type {
  InferenceOptions,
  ModelHandle,
  ModelHealth,
  ModelInput,
  ModelLoadContext,
  ModelManifest,
  ModelOutput,
} from './model.types.js';

export interface IModelAdapter {
  readonly library: string;

  canHandle(manifest: ModelManifest): boolean;

  validate(manifest: ModelManifest): Promise<void>;

  load(manifest: ModelManifest, context: ModelLoadContext): Promise<ModelHandle>;

  unload(handle: ModelHandle): Promise<void>;

  predict(
    handle: ModelHandle,
    input: ModelInput,
    options?: InferenceOptions,
  ): Promise<ModelOutput>;

  healthCheck(handle: ModelHandle): Promise<ModelHealth>;
}
