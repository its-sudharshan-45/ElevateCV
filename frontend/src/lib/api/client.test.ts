import { describe, expect, it } from 'vitest';
import { ApiClientError } from '@/lib/api/client';

describe('ApiClientError', () => {
  it('preserves structured API error metadata', () => {
    const error = new ApiClientError(404, {
      error: {
        code: 'NOT_FOUND',
        message: 'Resource not found',
        requestId: 'req-123',
      },
    });

    expect(error.status).toBe(404);
    expect(error.code).toBe('NOT_FOUND');
    expect(error.message).toBe('Resource not found');
  });
});
