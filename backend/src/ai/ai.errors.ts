import { AppError, ErrorCode } from '../utils/errors.js';

export function isRecoverableAiError(error: unknown): boolean {
  if (error instanceof AppError) {
    const recoverableCodes: ErrorCode[] = [
      'AI_PROVIDER_UNAVAILABLE',
      'AI_PROVIDER_AUTHENTICATION_FAILED',
      'AI_PROVIDER_RATE_LIMITED',
      'AI_PROVIDER_TIMEOUT',
      'AI_PROVIDER_INVALID_RESPONSE',
      'EXTERNAL_SERVICE_ERROR',
      'AI_PROVIDER_ERROR',
    ];
    return recoverableCodes.includes(error.code);
  }
  return false;
}

export function classifyAiError(error: unknown, providerName: string): AppError {
  if (error instanceof AppError) {
    return error;
  }

  const errMessage = error instanceof Error ? error.message : String(error);
  const lower = errMessage.toLowerCase();

  if (
    lower.includes('rate limit') ||
    lower.includes('429') ||
    lower.includes('too many requests') ||
    lower.includes('quota') ||
    lower.includes('credit balance') ||
    lower.includes('credit') ||
    lower.includes('billing')
  ) {
    return new AppError(
      `AI provider ${providerName} rate limit or credit quota exceeded`,
      429,
      'AI_PROVIDER_RATE_LIMITED',
    );
  }

  if (
    lower.includes('auth') ||
    lower.includes('401') ||
    lower.includes('403') ||
    lower.includes('api key') ||
    lower.includes('unauthorized') ||
    lower.includes('forbidden')
  ) {
    return new AppError(
      `AI provider ${providerName} authentication failed`,
      502,
      'AI_PROVIDER_AUTHENTICATION_FAILED',
    );
  }

  if (
    lower.includes('timeout') ||
    lower.includes('timed out') ||
    lower.includes('abort') ||
    lower.includes('deadline')
  ) {
    return new AppError(
      `AI provider ${providerName} request timed out`,
      504,
      'AI_PROVIDER_TIMEOUT',
    );
  }

  if (
    lower.includes('econnrefused') ||
    lower.includes('enotfound') ||
    lower.includes('500') ||
    lower.includes('502') ||
    lower.includes('503') ||
    lower.includes('service unavailable')
  ) {
    return new AppError(
      `AI provider ${providerName} service unavailable`,
      503,
      'AI_PROVIDER_UNAVAILABLE',
    );
  }

  return new AppError(
    `AI provider ${providerName} error: ${errMessage.slice(0, 100)}`,
    502,
    'AI_PROVIDER_ERROR',
  );
}
