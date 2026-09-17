import { AppError } from '../utils/errors.js';

export function getRouteParam(params: Record<string, string | string[]>, key: string): string {
  const value = params[key];

  if (typeof value === 'string' && value.length > 0) {
    return value;
  }

  throw new AppError('Invalid request parameter', 400, 'VALIDATION_ERROR');
}
