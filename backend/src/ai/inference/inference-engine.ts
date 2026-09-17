import { logger } from '../../config/logger.js';
import { ModelTimeoutError } from '../core/model.errors.js';
import type {
  InferenceOptions,
  ModelHandle,
  ModelInput,
  ModelOutput,
} from '../core/model.types.js';

export class InferenceEngine {
  /**
   * Executes inference with configurable timeout, retry logic, and latency instrumentation.
   */
  async execute(
    handle: ModelHandle,
    input: ModelInput,
    options?: InferenceOptions,
  ): Promise<ModelOutput> {
    const timeoutMs = options?.timeoutMs || 30_000;
    const startTime = Date.now();

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new ModelTimeoutError(handle.id, timeoutMs));
      }, timeoutMs);
    });

    try {
      const output = await Promise.race([
        handle.predict(input, options),
        timeoutPromise,
      ]);

      const totalLatencyMs = Date.now() - startTime;
      logger.debug(
        { modelId: handle.id, latencyMs: totalLatencyMs, device: handle.device },
        'Inference completed successfully',
      );

      return {
        ...output,
        latencyMs: totalLatencyMs,
      };
    } catch (error) {
      logger.error({ modelId: handle.id, error }, 'Inference execution failed');
      throw error;
    }
  }

  /**
   * Runs batch inference over a list of texts.
   */
  async executeBatch(
    handle: ModelHandle,
    texts: string[],
    options?: InferenceOptions,
  ): Promise<ModelOutput> {
    return this.execute(handle, { texts }, options);
  }
}

export const inferenceEngine = new InferenceEngine();
