import { z } from 'zod';

export const modelDependencySchema = z.object({
  package: z.string().min(1),
  version: z.string().optional(),
});

export const modelManifestSchema = z.object({
  id: z.string().min(1),
  name: z.string().optional(),
  description: z.string().optional(),

  hub: z.object({
    provider: z.literal('huggingface'),
    modelId: z.string().min(1),
    revision: z.string().optional(),
    commitHash: z.string().optional(),
    modelUrl: z.string().url().optional(),
  }),

  architecture: z.object({
    library: z.enum(['transformers', 'sentence-transformers', 'diffusers', 'timm', 'custom']),
    architectureType: z.string().min(1),
    task: z.enum([
      'text-generation',
      'text-classification',
      'token-classification',
      'embeddings',
      'image-classification',
      'image-generation',
      'audio',
      'multimodal',
      'other',
    ]),
    modality: z.enum(['text', 'image', 'audio', 'multimodal']),
  }),

  configuration: z.record(z.unknown()).default({}),

  dependencies: z.array(modelDependencySchema).default([]),

  capabilities: z.object({
    batching: z.boolean().default(false),
    streaming: z.boolean().default(false),
    training: z.boolean().default(false),
    peft: z.boolean().default(false),
    quantization: z.boolean().default(false),
  }),

  runtime: z.object({
    device: z.enum(['cpu', 'cuda', 'mps', 'webgpu', 'wasm', 'auto']).default('auto'),
    dtype: z.string().default('fp32'),
    quantization: z.enum(['fp32', 'fp16', 'bf16', 'int8', '4-bit', 'q4', 'q8', 'auto']).optional(),
    maxBatchSize: z.number().int().positive().optional(),
  }),

  security: z.object({
    trusted: z.boolean().default(false),
    allowlisted: z.boolean().default(false),
    lastScannedAt: z.string().optional(),
  }),

  status: z.enum(['discovered', 'validated', 'active', 'deprecated', 'unavailable', 'failed']).default('discovered'),
});

export type ValidatedModelManifest = z.infer<typeof modelManifestSchema>;
