import { logger } from '../../config/logger.js';
import type { ModelManifest, QuantizationMethod } from '../core/model.types.js';

export class QuantizationManager {
  private readonly supportedMethods: Record<string, QuantizationMethod[]> = {
    transformers: ['fp32', 'fp16', 'int8', '4-bit', 'q8', 'q4', 'auto'],
    'sentence-transformers': ['fp32', 'fp16', 'int8', 'q8', 'auto'],
    diffusers: ['fp32', 'fp16', 'bf16', 'auto'],
    timm: ['fp32', 'fp16', 'auto'],
    custom: ['fp32', 'auto'],
  };

  isQuantizationSupported(library: string, method: QuantizationMethod): boolean {
    const list = this.supportedMethods[library] || ['fp32', 'auto'];
    return list.includes(method);
  }

  resolveQuantization(manifest: ModelManifest, requested?: QuantizationMethod): boolean | string {
    const lib = manifest.architecture.library;
    const target = requested || manifest.runtime.quantization || 'auto';

    if (!this.isQuantizationSupported(lib, target)) {
      logger.warn(
        { library: lib, requested: target },
        'Requested quantization method not supported for library. Defaulting to standard precision.',
      );
      return false;
    }

    if (target === 'auto' || target === 'int8' || target === '4-bit' || target === 'q4' || target === 'q8') {
      return manifest.capabilities.quantization;
    }

    if (target === 'fp32') {
      return false;
    }

    return true;
  }
}

export const quantizationManager = new QuantizationManager();
