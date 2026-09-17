export type AiProviderName = 'groq' | 'anthropic' | 'openai';

export interface AiChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AiCompletionOptions {
  messages: AiChatMessage[];
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'text' | 'json';
  timeoutMs?: number;
}

export interface AiCompletionResult {
  content: string;
  provider: AiProviderName;
  model: string;
  latencyMs: number;
}

export interface AiProviderStatus {
  provider: AiProviderName;
  configured: boolean;
  available: boolean;
  latencyMs?: number;
  error?: string;
}

export interface IAiProvider {
  readonly name: AiProviderName;
  isConfigured(): boolean;
  complete(options: AiCompletionOptions): Promise<AiCompletionResult>;
  healthCheck(): Promise<AiProviderStatus>;
}
