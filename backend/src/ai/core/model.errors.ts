import { AppError } from '../../utils/errors.js';

export class ModelNotFoundError extends AppError {
  constructor(modelId: string) {
    super(`Model '${modelId}' not found in model registry`, 404, 'MODEL_NOT_FOUND', { modelId });
  }
}

export class ModelDownloadError extends AppError {
  constructor(modelId: string, reason: string) {
    super(`Failed to download model '${modelId}': ${reason}`, 502, 'MODEL_DOWNLOAD_ERROR', { modelId, reason });
  }
}

export class ModelAuthenticationError extends AppError {
  constructor(modelId: string) {
    super(`Authentication failed for Hugging Face model '${modelId}'`, 401, 'MODEL_AUTHENTICATION_ERROR', { modelId });
  }
}

export class ModelUnavailableError extends AppError {
  constructor(modelId: string, details?: unknown) {
    super(`Model '${modelId}' is currently unavailable`, 503, 'MODEL_UNAVAILABLE', { modelId, details });
  }
}

export class ModelCompatibilityError extends AppError {
  constructor(modelId: string, message: string) {
    super(`Model '${modelId}' compatibility error: ${message}`, 400, 'MODEL_COMPATIBILITY_ERROR', { modelId, message });
  }
}

export class ModelInitializationError extends AppError {
  constructor(modelId: string, error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    super(`Failed to initialize model '${modelId}': ${errorMsg}`, 500, 'MODEL_INITIALIZATION_ERROR', { modelId, errorMsg });
  }
}

export class ModelInferenceError extends AppError {
  constructor(modelId: string, error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    super(`Inference failed on model '${modelId}': ${errorMsg}`, 500, 'MODEL_INFERENCE_ERROR', { modelId, errorMsg });
  }
}

export class ModelOutOfMemoryError extends AppError {
  constructor(modelId: string, device: string) {
    super(`Out of memory while loading/running model '${modelId}' on ${device}`, 507, 'MODEL_OOM_ERROR', { modelId, device });
  }
}

export class ModelTimeoutError extends AppError {
  constructor(modelId: string, timeoutMs: number) {
    super(`Model inference timed out after ${timeoutMs}ms on '${modelId}'`, 504, 'MODEL_TIMEOUT', { modelId, timeoutMs });
  }
}

export class ModelSecurityError extends AppError {
  constructor(modelId: string, reason: string) {
    super(`Model '${modelId}' failed security validation: ${reason}`, 403, 'MODEL_SECURITY_ERROR', { modelId, reason });
  }
}

export class InvalidModelOutputError extends AppError {
  constructor(modelId: string, reason: string, rawOutput?: unknown) {
    super(`Invalid structured output from model '${modelId}': ${reason}`, 422, 'INVALID_MODEL_OUTPUT', { modelId, reason, rawOutput });
  }
}
