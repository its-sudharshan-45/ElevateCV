export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'AUTHORIZATION_ERROR'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'EXTERNAL_SERVICE_ERROR'
  | 'AI_PROVIDER_ERROR'
  | 'AI_PROVIDER_UNAVAILABLE'
  | 'AI_PROVIDER_AUTHENTICATION_FAILED'
  | 'AI_PROVIDER_RATE_LIMITED'
  | 'AI_PROVIDER_TIMEOUT'
  | 'AI_PROVIDER_INVALID_RESPONSE'
  | 'AI_ALL_PROVIDERS_FAILED'
  | 'MODEL_NOT_FOUND'
  | 'MODEL_DOWNLOAD_ERROR'
  | 'MODEL_AUTHENTICATION_ERROR'
  | 'MODEL_UNAVAILABLE'
  | 'MODEL_COMPATIBILITY_ERROR'
  | 'MODEL_INITIALIZATION_ERROR'
  | 'MODEL_INFERENCE_ERROR'
  | 'MODEL_OOM_ERROR'
  | 'MODEL_TIMEOUT'
  | 'MODEL_SECURITY_ERROR'
  | 'INVALID_MODEL_OUTPUT'
  | 'DATABASE_ERROR'
  | 'INTERNAL_SERVER_ERROR';

export class AppError extends Error {
  readonly statusCode: number;
  readonly code: ErrorCode;
  readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number,
    code: ErrorCode,
    details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
