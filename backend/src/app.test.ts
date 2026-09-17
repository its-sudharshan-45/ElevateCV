import { describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from './app.js';
import { healthService } from './modules/health/health.service.js';

vi.mock('./config/supabase.js', () => ({
  getSupabaseAdmin: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        limit: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'test' }, error: null }),
        })),
      })),
    })),
  })),
  createSupabaseClient: vi.fn(),
}));

describe('Health foundation', () => {
  it('returns ok status from health service', async () => {
    const status = await healthService.getStatus();

    expect(status.status).toBe('ok');
    expect(status.service).toBe('upskilr-api');
    expect(status.uptimeSeconds).toBeGreaterThanOrEqual(0);
    expect(status.checks.database.status).toBe('ok');
  });

  it('GET /api/v1/health returns structured health payload', async () => {
    const app = createApp();
    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      status: 'ok',
      service: 'upskilr-api',
    });
    expect(response.headers['x-request-id']).toBeDefined();
  });

  it('returns 404 for unknown routes with structured error', async () => {
    const app = createApp();
    const response = await request(app).get('/api/v1/unknown');

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
    expect(response.headers['x-request-id']).toBeDefined();
  });
});
