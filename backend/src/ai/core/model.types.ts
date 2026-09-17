export type ModelLibrary =
  | 'transformers'
  | 'sentence-transformers'
  | 'diffusers'
  | 'timm'
  | 'custom';

export type ModelTask =
  | 'text-generation'
  | 'text-classification'
  | 'token-classification'
  | 'embeddings'
  | 'image-classification'
  | 'image-generation'
  | 'audio'
  | 'multimodal'
  | 'other';

export type ModelModality = 'text' | 'image' | 'audio' | 'multimodal';

export type ModelStatus =
  | 'discovered'
  | 'validated'
  | 'active'
  | 'deprecated'
  | 'unavailable'
  | 'failed';

export type DeviceType = 'cpu' | 'cuda' | 'mps' | 'webgpu' | 'wasm' | 'auto';

export type QuantizationMethod =
  | 'fp32'
  | 'fp16'
  | 'bf16'
  | 'int8'
  | '4-bit'
  | 'q4'
  | 'q8'
  | 'auto';

export interface ModelDependency {
  package: string;
  version?: string;
}

export interface ModelManifest {
  id: string;
  name?: string;
  description?: string;

  hub: {
    provider: 'huggingface';
    modelId: string;
    revision?: string;
    commitHash?: string;
    modelUrl?: string;
  };

  architecture: {
    library: ModelLibrary;
    architectureType: string;
    task: ModelTask;
    modality: ModelModality;
  };

  configuration: Record<string, unknown>;

  dependencies: ModelDependency[];

  capabilities: {
    batching: boolean;
    streaming: boolean;
    training: boolean;
    peft: boolean;
    quantization: boolean;
  };

  runtime: {
    device: DeviceType;
    dtype: string;
    quantization?: QuantizationMethod;
    maxBatchSize?: number;
  };

  security: {
    trusted: boolean;
    allowlisted: boolean;
    lastScannedAt?: string;
  };

  status: ModelStatus;
}

export interface ModelLoadContext {
  device?: DeviceType;
  dtype?: string;
  quantization?: QuantizationMethod;
  cacheDir?: string;
  authToken?: string;
  concurrencyLimit?: number;
}

export interface InferenceOptions {
  temperature?: number;
  topK?: number;
  topP?: number;
  maxTokens?: number;
  stopSequences?: string[];
  repetitionPenalty?: number;
  timeoutMs?: number;
  stream?: boolean;
  quantized?: boolean;
}

export interface ModelInput {
  text?: string;
  texts?: string[];
  prompt?: string;
  image?: unknown;
  context?: Record<string, unknown>;
}

export interface ModelOutput {
  raw: unknown;
  text?: string;
  entities?: Array<{
    entity: string;
    score: number;
    word: string;
    start?: number;
    end?: number;
    index?: number;
  }>;
  embeddings?: number[][];
  embedding?: number[];
  generatedImages?: string[];
  latencyMs: number;
  modelId: string;
  device: string;
}

export interface ModelHandle {
  id: string;
  manifest: ModelManifest;
  instance: unknown;
  loadedAt: Date;
  device: DeviceType;
  dtype: string;
  quantization?: QuantizationMethod;
  memoryUsageBytes?: number;
  predict(input: ModelInput, options?: InferenceOptions): Promise<ModelOutput>;
  unload(): Promise<void>;
  healthCheck(): Promise<ModelHealth>;
}

export interface ModelHealth {
  modelId: string;
  status: 'Healthy' | 'Degraded' | 'Unavailable' | 'Deprecated' | 'Failed';
  latencyMs?: number;
  memoryUsageBytes?: number;
  lastCheckedAt: string;
  details?: Record<string, unknown>;
  error?: string;
}
