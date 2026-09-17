import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';

const mockGetUser = vi.fn();

vi.mock('../../config/supabase.js', () => ({
  getSupabaseAdmin: vi.fn(() => ({
    auth: { getUser: mockGetUser },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        download: vi.fn(),
        remove: vi.fn(),
      })),
    },
  })),
  createSupabaseClient: vi.fn(),
}));

vi.mock('../resume/resume.repository.js', () => ({
  resumeRepository: {
    create: vi.fn(),
    findByIdForUser: vi.fn(),
    listByUserId: vi.fn(),
    updateProcessing: vi.fn(),
    deleteByIdForUser: vi.fn(),
  },
}));

vi.mock('./resume-version.repository.js', () => ({
  resumeVersionRepository: {
    getNextVersionNumber: vi.fn(),
    create: vi.fn(),
    listForResume: vi.fn(),
    findByIdForUser: vi.fn(),
    deleteByIdForUser: vi.fn(),
  },
}));

import { resumeRepository } from '../resume/resume.repository.js';
import { resumeVersionRepository } from './resume-version.repository.js';

const USER_A = '11111111-1111-1111-1111-111111111111';
const RESUME_ID = '33333333-3333-3333-3333-333333333333';
const VERSION_ID_A = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const VERSION_ID_B = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const ACCESS_TOKEN = 'valid-access-token';

const processedResume = {
  id: RESUME_ID,
  user_id: USER_A,
  original_filename: 'resume.pdf',
  storage_path: `${USER_A}/${RESUME_ID}/file.pdf`,
  mime_type: 'application/pdf',
  file_size: 1024,
  processing_status: 'PROCESSED' as const,
  extracted_text: 'text',
  structured_data: { sections: [], skills: ['TypeScript', 'Node.js'] },
  analysis_result: null,
  score: 80,
  failure_reason: null,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

const sampleVersionRecord = {
  id: VERSION_ID_A,
  resume_id: RESUME_ID,
  user_id: USER_A,
  version_number: 1,
  title: 'Version 1',
  changes_summary: 'Initial version',
  structured_data: { sections: [], skills: ['TypeScript', 'Node.js'] },
  score: 80,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

const sampleVersionRecordB = {
  ...sampleVersionRecord,
  id: VERSION_ID_B,
  version_number: 2,
  title: 'Version 2',
  structured_data: { sections: [], skills: ['TypeScript', 'Node.js', 'React'] },
  score: 90,
};

function authHeader(token = ACCESS_TOKEN) {
  return { Authorization: `Bearer ${token}` };
}

describe('Resume Version API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: USER_A, email: 'jane@example.com' } },
      error: null,
    });
  });

  it('returns 401 for unauthenticated create', async () => {
    const app = createApp();
    const res = await request(app).post(`/api/v1/resumes/${RESUME_ID}/versions`);
    expect(res.status).toBe(401);
  });

  it('creates a version from a processed resume', async () => {
    vi.mocked(resumeRepository.findByIdForUser).mockResolvedValue(processedResume);
    vi.mocked(resumeVersionRepository.getNextVersionNumber).mockResolvedValue(1);
    vi.mocked(resumeVersionRepository.create).mockResolvedValue(sampleVersionRecord);

    const app = createApp();
    const res = await request(app)
      .post(`/api/v1/resumes/${RESUME_ID}/versions`)
      .set(authHeader())
      .send({ title: 'Version 1', changesSummary: 'Initial version' });

    expect(res.status).toBe(201);
    expect(res.body.version.title).toBe('Version 1');
    expect(res.body.version.versionNumber).toBe(1);
    expect(res.body.version.score).toBe(80);
  });

  it('returns 409 when resume is not yet processed', async () => {
    vi.mocked(resumeRepository.findByIdForUser).mockResolvedValue({
      ...processedResume,
      processing_status: 'UPLOADED' as const,
    });

    const app = createApp();
    const res = await request(app)
      .post(`/api/v1/resumes/${RESUME_ID}/versions`)
      .set(authHeader())
      .send({ title: 'Early version' });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('returns 400 when title is missing', async () => {
    vi.mocked(resumeRepository.findByIdForUser).mockResolvedValue(processedResume);

    const app = createApp();
    const res = await request(app)
      .post(`/api/v1/resumes/${RESUME_ID}/versions`)
      .set(authHeader())
      .send({ changesSummary: 'No title' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('lists versions for owned resume', async () => {
    vi.mocked(resumeRepository.findByIdForUser).mockResolvedValue(processedResume);
    vi.mocked(resumeVersionRepository.listForResume).mockResolvedValue([sampleVersionRecord]);

    const app = createApp();
    const res = await request(app)
      .get(`/api/v1/resumes/${RESUME_ID}/versions`)
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.versions).toHaveLength(1);
  });

  it('returns 404 when listing versions for unknown resume', async () => {
    vi.mocked(resumeRepository.findByIdForUser).mockResolvedValue(null);

    const app = createApp();
    const res = await request(app)
      .get(`/api/v1/resumes/${RESUME_ID}/versions`)
      .set(authHeader());

    expect(res.status).toBe(404);
  });

  it('compares two versions and returns score delta and skill diff', async () => {
    vi.mocked(resumeVersionRepository.findByIdForUser)
      .mockResolvedValueOnce(sampleVersionRecord)
      .mockResolvedValueOnce(sampleVersionRecordB);

    const app = createApp();
    const res = await request(app)
      .get(`/api/v1/resumes/${RESUME_ID}/versions/compare`)
      .set(authHeader())
      .query({ versionA: VERSION_ID_A, versionB: VERSION_ID_B });

    expect(res.status).toBe(200);
    expect(res.body.comparison.scoreDelta).toBe(10);
    expect(res.body.comparison.skillDiff.added).toContain('React');
    expect(res.body.comparison.skillDiff.removed).toHaveLength(0);
  });

  it('returns 400 when compare query params are invalid UUIDs', async () => {
    const app = createApp();
    const res = await request(app)
      .get(`/api/v1/resumes/${RESUME_ID}/versions/compare`)
      .set(authHeader())
      .query({ versionA: 'not-a-uuid', versionB: VERSION_ID_B });

    expect(res.status).toBe(400);
  });

  it('deletes an owned version', async () => {
    vi.mocked(resumeVersionRepository.findByIdForUser).mockResolvedValue(sampleVersionRecord);
    vi.mocked(resumeVersionRepository.deleteByIdForUser).mockResolvedValue(true);

    const app = createApp();
    const res = await request(app)
      .delete(`/api/v1/resumes/${RESUME_ID}/versions/${VERSION_ID_A}`)
      .set(authHeader());

    expect(res.status).toBe(204);
  });

  it('returns 404 when deleting a non-existent version', async () => {
    vi.mocked(resumeVersionRepository.findByIdForUser).mockResolvedValue(null);
    vi.mocked(resumeVersionRepository.deleteByIdForUser).mockResolvedValue(false);

    const app = createApp();
    const res = await request(app)
      .delete(`/api/v1/resumes/${RESUME_ID}/versions/${VERSION_ID_A}`)
      .set(authHeader());

    expect(res.status).toBe(404);
  });
});
