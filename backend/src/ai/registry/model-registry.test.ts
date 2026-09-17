import { describe, expect, it, beforeEach } from 'vitest';
import { ModelRegistry } from './model-registry.js';
import type { ModelManifest } from '../core/model.types.js';

const makeManifest = (id: string, overrides?: Partial<ModelManifest>): ModelManifest => ({
  id,
  hub: { provider: 'huggingface', modelId: `org/${id}`, revision: 'main' },
  architecture: {
    library: 'transformers',
    architectureType: 'token-classification',
    task: 'token-classification',
    modality: 'text',
  },
  configuration: {},
  dependencies: [{ package: '@huggingface/transformers' }],
  capabilities: { batching: true, streaming: false, training: false, peft: false, quantization: true },
  runtime: { device: 'auto', dtype: 'fp32' },
  security: { trusted: true, allowlisted: true },
  status: 'active',
  ...overrides,
});

describe('ModelRegistry', () => {
  let registry: ModelRegistry;

  beforeEach(() => {
    registry = new ModelRegistry();
  });

  it('seeds default production models on construction', () => {
    const all = registry.getAll();
    expect(all.length).toBeGreaterThanOrEqual(3);
    const ids = all.map((m) => m.id);
    expect(ids).toContain('resume-ner');
    expect(ids).toContain('embedding-minilm');
    expect(ids).toContain('bge-small-en');
  });

  it('registers a new model and retrieves it by id', () => {
    const manifest = makeManifest('test-model-01');
    registry.register(manifest);
    const retrieved = registry.get('test-model-01');
    expect(retrieved.id).toBe('test-model-01');
    expect(retrieved.hub.modelId).toBe('org/test-model-01');
  });

  it('throws ModelNotFoundError when getting nonexistent model', () => {
    expect(() => registry.get('nonexistent-model-xyz')).toThrow('not found');
  });

  it('unregisters a model', () => {
    const manifest = makeManifest('temp-model');
    registry.register(manifest);
    const deleted = registry.unregister('temp-model');
    expect(deleted).toBe(true);
    expect(registry.has('temp-model')).toBe(false);
  });

  it('findByTask returns models matching given task', () => {
    registry.register(makeManifest('embedding-test', {
      architecture: {
        library: 'sentence-transformers',
        architectureType: 'embeddings',
        task: 'embeddings',
        modality: 'text',
      },
    }));
    const found = registry.findByTask('embeddings');
    expect(found.length).toBeGreaterThanOrEqual(1);
    expect(found.every((m) => m.architecture.task === 'embeddings')).toBe(true);
  });

  it('findByLibrary returns models matching given library', () => {
    const transformersModels = registry.findByLibrary('transformers');
    expect(transformersModels.length).toBeGreaterThanOrEqual(1);
    expect(transformersModels.some((m) => m.id === 'resume-ner')).toBe(true);
  });

  it('findByCapability returns models supporting quantization', () => {
    const qModels = registry.findByCapability('quantization');
    expect(qModels.length).toBeGreaterThanOrEqual(1);
  });

  it('markDeprecated sets model status to deprecated', () => {
    registry.register(makeManifest('soon-deprecated'));
    registry.markDeprecated('soon-deprecated', 'replacing with new model');
    const m = registry.get('soon-deprecated');
    expect(m.status).toBe('deprecated');
  });

  it('markUnavailable sets model status to unavailable', () => {
    registry.register(makeManifest('broken-model'));
    registry.markUnavailable('broken-model', 'Hub went offline');
    const m = registry.get('broken-model');
    expect(m.status).toBe('unavailable');
  });

  it('update merges partial changes onto existing manifest', () => {
    registry.register(makeManifest('update-target'));
    registry.update('update-target', { status: 'validated', description: 'Updated model' });
    const updated = registry.get('update-target');
    expect(updated.status).toBe('validated');
    expect(updated.description).toBe('Updated model');
  });
});
