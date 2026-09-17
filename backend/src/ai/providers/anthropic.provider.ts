import Anthropic from '@anthropic-ai/sdk';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/errors.js';
import { classifyAiError } from '../ai.errors.js';
import type {
  AiCompletionOptions,
  AiCompletionResult,
  AiProviderName,
  AiProviderStatus,
  IAiProvider,
} from '../ai.types.js';

export class AnthropicProvider implements IAiProvider {
  readonly name: AiProviderName = 'anthropic';
  private client: Anthropic | null = null;
  private get defaultModel() { return env.ANTHROPIC_MODEL; }

  private getClient(): Anthropic {
    if (!this.client) {
      if (!env.ANTHROPIC_API_KEY) {
        throw new AppError(
          'Anthropic API key is not configured',
          502,
          'AI_PROVIDER_AUTHENTICATION_FAILED',
        );
      }
      this.client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    }
    return this.client;
  }

  isConfigured(): boolean {
    return Boolean(env.ANTHROPIC_API_KEY && env.ANTHROPIC_API_KEY.trim().length > 0);
  }

  async complete(options: AiCompletionOptions): Promise<AiCompletionResult> {
    if (!this.isConfigured()) {
      throw new AppError(
        'Anthropic provider is not configured with a valid API key',
        502,
        'AI_PROVIDER_AUTHENTICATION_FAILED',
      );
    }

    const start = Date.now();
    const timeoutMs = options.timeoutMs ?? env.AI_TIMEOUT_MS;

    try {
      const client = this.getClient();

      // Separate system messages for Anthropic SDK
      const systemMessages = options.messages.filter((m) => m.role === 'system');
      const nonSystemMessages = options.messages.filter((m) => m.role !== 'system');

      const systemPrompt = systemMessages.map((m) => m.content).join('\n\n');

      const formattedMessages: Anthropic.MessageParam[] = nonSystemMessages.map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      }));

      // Ensure there's at least one message
      if (formattedMessages.length === 0) {
        formattedMessages.push({ role: 'user', content: 'Hello' });
      }

      const response = await client.messages.create(
        {
          model: this.defaultModel,
          max_tokens: options.maxTokens ?? 1024,
          temperature: options.temperature ?? 0.7,
          system: systemPrompt.length > 0 ? systemPrompt : undefined,
          messages: formattedMessages,
        },
        {
          timeout: timeoutMs,
        },
      );

      const textBlock = response.content.find((c) => c.type === 'text');
      const content = textBlock && 'text' in textBlock ? textBlock.text : '';

      if (!content.trim()) {
        throw new AppError(
          'Anthropic returned an empty response',
          502,
          'AI_PROVIDER_INVALID_RESPONSE',
        );
      }

      return {
        content,
        provider: this.name,
        model: this.defaultModel,
        latencyMs: Date.now() - start,
      };
    } catch (err) {
      throw classifyAiError(err, this.name);
    }
  }

  async healthCheck(): Promise<AiProviderStatus> {
    const configured = this.isConfigured();
    if (!configured) {
      return {
        provider: this.name,
        configured: false,
        available: false,
        error: 'API key not configured',
      };
    }

    const start = Date.now();
    try {
      const client = this.getClient();
      await client.messages.create(
        {
          model: this.defaultModel,
          max_tokens: 5,
          messages: [{ role: 'user', content: 'ping' }],
        },
        { timeout: 5000 },
      );

      return {
        provider: this.name,
        configured: true,
        available: true,
        latencyMs: Date.now() - start,
      };
    } catch (err) {
      const classified = classifyAiError(err, this.name);
      return {
        provider: this.name,
        configured: true,
        available: false,
        latencyMs: Date.now() - start,
        error: classified.message,
      };
    }
  }
}

export const anthropicProvider = new AnthropicProvider();
