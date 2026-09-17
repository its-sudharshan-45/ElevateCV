import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { AppError } from '../utils/errors.js';
import { isRecoverableAiError } from './ai.errors.js';
import type {
  AiCompletionOptions,
  AiCompletionResult,
  AiProviderName,
  AiProviderStatus,
  IAiProvider,
} from './ai.types.js';
import { anthropicProvider } from './providers/anthropic.provider.js';
import { groqProvider } from './providers/groq.provider.js';
import { openAiProvider } from './providers/openai.provider.js';

export class AiService {
  private readonly providers: Map<AiProviderName, IAiProvider>;

  constructor(
    customProviders?: Partial<Record<AiProviderName, IAiProvider>>,
  ) {
    this.providers = new Map<AiProviderName, IAiProvider>([
      ['groq', customProviders?.groq ?? groqProvider],
      ['anthropic', customProviders?.anthropic ?? anthropicProvider],
      ['openai', customProviders?.openai ?? openAiProvider],
    ]);
  }

  private getProvider(name: AiProviderName): IAiProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new AppError(
        `AI provider '${name}' is not supported`,
        500,
        'AI_PROVIDER_UNAVAILABLE',
      );
    }
    return provider;
  }

  private getProviderExecutionOrder(): AiProviderName[] {
    const primary = env.AI_PRIMARY_PROVIDER as AiProviderName;
    const order: AiProviderName[] = [primary];

    if (env.AI_FALLBACK_ENABLED) {
      const fallbackNames = env.AI_FALLBACK_PROVIDERS.split(',')
        .map((p) => p.trim().toLowerCase() as AiProviderName)
        .filter((p): p is AiProviderName => ['groq', 'anthropic', 'openai'].includes(p));

      for (const fallback of fallbackNames) {
        if (!order.includes(fallback)) {
          order.push(fallback);
        }
      }
    }

    return order;
  }

  async complete(options: AiCompletionOptions): Promise<AiCompletionResult> {
    const executionOrder = this.getProviderExecutionOrder();
    const attempts: { provider: string; error: string }[] = [];

    for (let i = 0; i < executionOrder.length; i++) {
      const providerName = executionOrder[i];
      const provider = this.getProvider(providerName);

      if (!provider.isConfigured()) {
        logger.debug({ provider: providerName }, 'AI provider skipped (not configured with API key)');
        attempts.push({ provider: providerName, error: 'Not configured' });
        continue;
      }

      try {
        logger.debug({ provider: providerName }, 'Attempting AI completion with provider');
        const result = await provider.complete(options);
        logger.info(
          { provider: providerName, model: result.model, latencyMs: result.latencyMs },
          'AI completion succeeded',
        );
        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        attempts.push({ provider: providerName, error: errorMsg });

        logger.warn(
          { provider: providerName, error: errorMsg, isLast: i === executionOrder.length - 1 },
          'AI provider failed during completion',
        );

        // Do not fallback for non-recoverable / application errors
        if (!isRecoverableAiError(err)) {
          throw err;
        }

        // If fallback is disabled or this was the last provider in line, break
        if (!env.AI_FALLBACK_ENABLED || i === executionOrder.length - 1) {
          break;
        }
      }
    }

    logger.error({ attempts }, 'All configured AI providers failed to fulfill the request');
    throw new AppError(
      'The AI service is temporarily unavailable. Please try again shortly.',
      503,
      'AI_ALL_PROVIDERS_FAILED',
      { attempts: attempts.map((a) => ({ provider: a.provider })) },
    );
  }

  async checkProviderHealth(): Promise<AiProviderStatus[]> {
    const statuses: AiProviderStatus[] = [];
    const providerNames: AiProviderName[] = ['groq', 'anthropic', 'openai'];

    for (const name of providerNames) {
      const provider = this.getProvider(name);
      if (!provider.isConfigured()) {
        statuses.push({
          provider: name,
          configured: false,
          available: false,
          error: 'API key not configured',
        });
      } else {
        const status = await provider.healthCheck();
        statuses.push(status);
      }
    }

    return statuses;
  }
}

export const aiService = new AiService();
