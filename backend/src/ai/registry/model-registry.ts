import { logger } from '../../config/logger.js';
import { ModelNotFoundError } from '../core/model.errors.js';
import type {
  ModelLibrary,
  ModelManifest,
  ModelModality,
  ModelStatus,
  ModelTask,
} from '../core/model.types.js';
import { modelManifestSchema } from './model-registry.schema.js';

export class ModelRegistry {
  private readonly manifests = new Map<string, ModelManifest>();

  constructor() {
    this.seedDefaultManifests();
  }

  private seedDefaultManifests(): void {
    const defaults: ModelManifest[] = [
      {
        id: 'resume-ner',
        name: 'Resume Named Entity Recognizer',
        description: 'Hugging Face token classification model for extracting entities from resumes',
        hub: {
          provider: 'huggingface',
          modelId: 'oksomu/resume-ner',
          revision: 'main',
          modelUrl: 'https://huggingface.co/oksomu/resume-ner',
        },
        architecture: {
          library: 'transformers',
          architectureType: 'token-classification',
          task: 'token-classification',
          modality: 'text',
        },
        configuration: {
          pipelineType: 'token-classification',
          aggregationStrategy: 'simple',
          maxChunkWords: 300,
        },
        dependencies: [
          { package: '@huggingface/transformers', version: '^3.8.1' },
        ],
        capabilities: {
          batching: true,
          streaming: false,
          training: false,
          peft: false,
          quantization: true,
        },
        runtime: {
          device: 'auto',
          dtype: 'fp32',
          quantization: 'auto',
          maxBatchSize: 16,
        },
        security: {
          trusted: true,
          allowlisted: true,
          lastScannedAt: new Date().toISOString(),
        },
        status: 'active',
      },
      {
        id: 'embedding-minilm',
        name: 'MiniLM L6 v2 Sentence Embeddings',
        description: 'Lightweight embedding model for semantic similarity and resume-job matching',
        hub: {
          provider: 'huggingface',
          modelId: 'sentence-transformers/all-MiniLM-L6-v2',
          revision: 'main',
          modelUrl: 'https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2',
        },
        architecture: {
          library: 'sentence-transformers',
          architectureType: 'embeddings',
          task: 'embeddings',
          modality: 'text',
        },
        configuration: {
          dimension: 384,
          maxSeqLength: 256,
          normalizeEmbeddings: true,
        },
        dependencies: [
          { package: '@huggingface/transformers', version: '^3.8.1' },
        ],
        capabilities: {
          batching: true,
          streaming: false,
          training: false,
          peft: false,
          quantization: true,
        },
        runtime: {
          device: 'auto',
          dtype: 'fp32',
          quantization: 'auto',
          maxBatchSize: 32,
        },
        security: {
          trusted: true,
          allowlisted: true,
          lastScannedAt: new Date().toISOString(),
        },
        status: 'active',
      },
      {
        id: 'bge-small-en',
        name: 'BAAI BGE Small English Embedding Model',
        description: 'High-accuracy dense embeddings for RAG and semantic skill retrieval',
        hub: {
          provider: 'huggingface',
          modelId: 'BAAI/bge-small-en-v1.5',
          revision: 'main',
          modelUrl: 'https://huggingface.co/BAAI/bge-small-en-v1.5',
        },
        architecture: {
          library: 'sentence-transformers',
          architectureType: 'embeddings',
          task: 'embeddings',
          modality: 'text',
        },
        configuration: {
          dimension: 384,
          maxSeqLength: 512,
          normalizeEmbeddings: true,
        },
        dependencies: [
          { package: '@huggingface/transformers', version: '^3.8.1' },
        ],
        capabilities: {
          batching: true,
          streaming: false,
          training: false,
          peft: false,
          quantization: true,
        },
        runtime: {
          device: 'auto',
          dtype: 'fp32',
          quantization: 'auto',
          maxBatchSize: 32,
        },
        security: {
          trusted: true,
          allowlisted: true,
          lastScannedAt: new Date().toISOString(),
        },
        status: 'active',
      },
    ];

    for (const manifest of defaults) {
      this.manifests.set(manifest.id, manifest);
    }
  }

  register(manifest: ModelManifest): ModelManifest {
    const validated = modelManifestSchema.parse(manifest) as ModelManifest;
    this.manifests.set(validated.id, validated);
    logger.info({ modelId: validated.id, library: validated.architecture.library }, 'Model manifest registered in registry');
    return validated;
  }

  unregister(id: string): boolean {
    const deleted = this.manifests.delete(id);
    if (deleted) {
      logger.info({ modelId: id }, 'Model manifest unregistered');
    }
    return deleted;
  }

  get(id: string): ModelManifest {
    const manifest = this.manifests.get(id);
    if (!manifest) {
      throw new ModelNotFoundError(id);
    }
    return manifest;
  }

  has(id: string): boolean {
    return this.manifests.has(id);
  }

  getAll(): ModelManifest[] {
    return Array.from(this.manifests.values());
  }

  findByTask(task: ModelTask): ModelManifest[] {
    return this.getAll().filter((m) => m.architecture.task === task);
  }

  findByLibrary(library: ModelLibrary): ModelManifest[] {
    return this.getAll().filter((m) => m.architecture.library === library);
  }

  findByModality(modality: ModelModality): ModelManifest[] {
    return this.getAll().filter((m) => m.architecture.modality === modality);
  }

  findByCapability(capability: keyof ModelManifest['capabilities']): ModelManifest[] {
    return this.getAll().filter((m) => m.capabilities[capability] === true);
  }

  findByHubModelId(hubModelId: string): ModelManifest | undefined {
    return this.getAll().find((m) => m.hub.modelId === hubModelId);
  }

  update(id: string, updates: Partial<ModelManifest>): ModelManifest {
    const existing = this.get(id);
    const updated: ModelManifest = {
      ...existing,
      ...updates,
      hub: { ...existing.hub, ...(updates.hub ?? {}) },
      architecture: { ...existing.architecture, ...(updates.architecture ?? {}) },
      capabilities: { ...existing.capabilities, ...(updates.capabilities ?? {}) },
      runtime: { ...existing.runtime, ...(updates.runtime ?? {}) },
      security: { ...existing.security, ...(updates.security ?? {}) },
    };

    const validated = modelManifestSchema.parse(updated) as ModelManifest;
    this.manifests.set(id, validated);
    logger.info({ modelId: id }, 'Model manifest updated in registry');
    return validated;
  }

  markStatus(id: string, status: ModelStatus): void {
    const existing = this.get(id);
    existing.status = status;
    this.manifests.set(id, existing);
    logger.info({ modelId: id, status }, 'Model status changed');
  }

  markDeprecated(id: string, reason?: string): void {
    this.markStatus(id, 'deprecated');
    if (reason) {
      logger.warn({ modelId: id, reason }, 'Model marked deprecated');
    }
  }

  markUnavailable(id: string, error?: string): void {
    this.markStatus(id, 'unavailable');
    if (error) {
      logger.warn({ modelId: id, error }, 'Model marked unavailable');
    }
  }
}

export const modelRegistry = new ModelRegistry();
