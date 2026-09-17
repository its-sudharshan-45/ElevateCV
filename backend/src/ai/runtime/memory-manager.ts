import os from 'node:os';
import { logger } from '../../config/logger.js';
import { ModelOutOfMemoryError } from '../core/model.errors.js';
import type { ModelManifest } from '../core/model.types.js';

export interface MemoryCheckResult {
  canFit: boolean;
  estimatedMemoryBytes: number;
  freeMemoryBytes: number;
  strategy: 'direct-load' | 'quantize-and-load' | 'reject-oom';
}

export class MemoryManager {
  /**
   * Estimates model memory footprint in bytes.
   * Typical lightweight models (e.g. 110M params) take ~440MB in FP32, ~110MB in INT8/quantized.
   */
  estimateModelMemory(manifest: ModelManifest): number {
    const isQuantized = manifest.runtime.quantization && manifest.runtime.quantization !== 'fp32';
    const isEmbedding = manifest.architecture.task === 'embeddings';
    const isClassification = manifest.architecture.task === 'token-classification' || manifest.architecture.task === 'text-classification';

    let estimatedBytes = 350 * 1024 * 1024; // 350MB default baseline for small transformer

    if (isEmbedding) {
      estimatedBytes = 120 * 1024 * 1024; // ~120MB for MiniLM/BGE-small
    } else if (isClassification) {
      estimatedBytes = 250 * 1024 * 1024; // ~250MB for resume-ner
    }

    if (isQuantized) {
      estimatedBytes = Math.round(estimatedBytes * 0.35); // ~35% memory footprint under INT8/q4
    }

    return estimatedBytes;
  }

  checkMemoryAvailability(manifest: ModelManifest): MemoryCheckResult {
    const estimatedMemoryBytes = this.estimateModelMemory(manifest);
    const freeMemoryBytes = os.freemem();
    const safetyBufferBytes = 100 * 1024 * 1024; // 100MB minimum OS buffer

    if (freeMemoryBytes > estimatedMemoryBytes + safetyBufferBytes) {
      return {
        canFit: true,
        estimatedMemoryBytes,
        freeMemoryBytes,
        strategy: 'direct-load',
      };
    }

    // Check if quantizing would allow it to fit
    const quantizedEstimated = Math.round(estimatedMemoryBytes * 0.35);
    if (freeMemoryBytes > quantizedEstimated + safetyBufferBytes) {
      logger.warn(
        { modelId: manifest.id, freeMemoryBytes, estimatedMemoryBytes, quantizedEstimated },
        'Low memory detected. Suggesting quantization strategy.',
      );
      return {
        canFit: true,
        estimatedMemoryBytes: quantizedEstimated,
        freeMemoryBytes,
        strategy: 'quantize-and-load',
      };
    }

    return {
      canFit: false,
      estimatedMemoryBytes,
      freeMemoryBytes,
      strategy: 'reject-oom',
    };
  }

  ensureCanLoad(manifest: ModelManifest, device: string): void {
    const check = this.checkMemoryAvailability(manifest);
    if (!check.canFit) {
      logger.error(
        { modelId: manifest.id, freeMem: check.freeMemoryBytes, requiredMem: check.estimatedMemoryBytes },
        'Insufficient system memory to load model',
      );
      throw new ModelOutOfMemoryError(manifest.id, device);
    }
  }
}

export const memoryManager = new MemoryManager();
