import { Groq } from 'groq-sdk';
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

export class GroqProvider implements IAiProvider {
  readonly name: AiProviderName = 'groq';
  private client: Groq | null = null;
  private get defaultModel() { return env.GROQ_MODEL; }

  private getClient(): Groq {
    if (!this.client) {
      if (!env.GROQ_API_KEY) {
        throw new AppError(
          'Groq API key is not configured',
          502,
          'AI_PROVIDER_AUTHENTICATION_FAILED',
        );
      }
      this.client = new Groq({ apiKey: env.GROQ_API_KEY });
    }
    return this.client;
  }

  isConfigured(): boolean {
    return Boolean(env.GROQ_API_KEY && env.GROQ_API_KEY.trim().length > 0);
  }

  async complete(options: AiCompletionOptions): Promise<AiCompletionResult> {
    if (!this.isConfigured()) {
      throw new AppError(
        'Groq provider is not configured with a valid API key',
        502,
        'AI_PROVIDER_AUTHENTICATION_FAILED',
      );
    }

    const start = Date.now();
    const timeoutMs = options.timeoutMs ?? env.AI_TIMEOUT_MS;

    try {
      const client = this.getClient();
      const response = await client.chat.completions.create(
        {
          model: this.defaultModel,
          messages: options.messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 1024,
          response_format:
            options.responseFormat === 'json' ? { type: 'json_object' } : undefined,
        },
        {
          timeout: timeoutMs,
        },
      );

      const content = response.choices[0]?.message?.content ?? '';
      if (!content.trim()) {
        throw new AppError(
          'Groq returned an empty response',
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
      await client.chat.completions.create(
        {
          model: this.defaultModel,
          messages: [{ role: 'user', content: 'ping' }],
          max_tokens: 5,
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

export const groqProvider = new GroqProvider();
