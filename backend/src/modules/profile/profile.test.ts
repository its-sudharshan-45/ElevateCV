import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';

const mockGetUser = vi.fn();

vi.mock('../../config/supabase.js', () => ({
  getSupabaseAdmin: vi.fn(() => ({
    auth: { getUser: mockGetUser },
  })),
  createSupabaseClient: vi.fn(),
}));

vi.mock('./profile.repository.js', async () => {
  const actual = await vi.importActual<typeof import('./profile.repository.js')>(
    './profile.repository.js',
  );

  return {
    ...actual,
    profileRepository: {
      findByUserId: vi.fn(),
      ensureForUserId: vi.fn(),
      updateByUserId: vi.fn(),
    },
  };
});

import { profileRepository } from './profile.repository.js';

const USER_ID = '11111111-1111-1111-1111-111111111111';
const ACCESS_TOKEN = 'valid-access-token';

const sampleProfileRecord = {
  id: USER_ID,
  full_name: 'Jane Doe',
  headline: 'Aspiring developer',
  target_role: 'Software Engineer',
  experience_level: 'student' as const,
  college: 'MIT',
  degree: 'Bachelor of Science',
  field_of_study: 'Computer Science',
  graduation_year: 2024,
  current_status: 'student' as const,
  skills: ['JavaScript', 'TypeScript'],
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

function authHeader(token = ACCESS_TOKEN) {
  return { Authorization: `Bearer ${token}` };
}

describe('Profile API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: USER_ID, email: 'jane@example.com' } },
      error: null,
    });
  });

  it('returns 401 when authentication header is missing', async () => {
    const app = createApp();
    const response = await request(app).get('/api/v1/profile');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('AUTHENTICATION_ERROR');
  });

  it('returns 401 when JWT verification fails', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid token' },
    });

    const app = createApp();
    const response = await request(app)
      .get('/api/v1/profile')
      .set(authHeader('invalid-token'));

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('AUTHENTICATION_ERROR');
  });

  it('returns authenticated profile for GET /api/v1/profile', async () => {
    vi.mocked(profileRepository.ensureForUserId).mockResolvedValue(sampleProfileRecord);

    const app = createApp();
    const response = await request(app).get('/api/v1/profile').set(authHeader());

    expect(response.status).toBe(200);
    expect(response.body.profile).toEqual({
      id: USER_ID,
      fullName: 'Jane Doe',
      headline: 'Aspiring developer',
      targetRole: 'Software Engineer',
      experienceLevel: 'student',
      dsaScore: 0,
      college: 'MIT',
      degree: 'Bachelor of Science',
      fieldOfStudy: 'Computer Science',
      graduationYear: 2024,
      currentStatus: 'student',
      skills: ['JavaScript', 'TypeScript'],
      createdAt: sampleProfileRecord.created_at,
      updatedAt: sampleProfileRecord.updated_at,
    });
    expect(profileRepository.ensureForUserId).toHaveBeenCalledWith(USER_ID);
  });

  it('synchronizes missing profile for authenticated user', async () => {
    const emptyProfile = {
      ...sampleProfileRecord,
      full_name: null,
      headline: null,
      target_role: null,
      experience_level: null,
    };

    vi.mocked(profileRepository.ensureForUserId).mockResolvedValue(emptyProfile);

    const app = createApp();
    const response = await request(app).get('/api/v1/profile').set(authHeader());

    expect(response.status).toBe(200);
    expect(response.body.profile.fullName).toBeNull();
    expect(profileRepository.ensureForUserId).toHaveBeenCalledWith(USER_ID);
  });

  it('rejects invalid profile update payload', async () => {
    const app = createApp();
    const response = await request(app)
      .patch('/api/v1/profile')
      .set(authHeader())
      .send({ experienceLevel: 'invalid-level' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects empty profile update payload', async () => {
    const app = createApp();
    const response = await request(app).patch('/api/v1/profile').set(authHeader()).send({});

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('updates profile for authenticated user', async () => {
    const updatedRecord = {
      ...sampleProfileRecord,
      full_name: 'Jane Smith',
      updated_at: '2026-01-02T00:00:00.000Z',
    };

    vi.mocked(profileRepository.updateByUserId).mockResolvedValue(updatedRecord);

    const app = createApp();
    const response = await request(app)
      .patch('/api/v1/profile')
      .set(authHeader())
      .send({ fullName: 'Jane Smith' });

    expect(response.status).toBe(200);
    expect(response.body.profile.fullName).toBe('Jane Smith');
    expect(profileRepository.updateByUserId).toHaveBeenCalledWith(USER_ID, {
      full_name: 'Jane Smith',
    });
  });

  it('scopes profile operations to authenticated user identity', async () => {
    vi.mocked(profileRepository.ensureForUserId).mockResolvedValue(sampleProfileRecord);

    const app = createApp();
    await request(app).get('/api/v1/profile').set(authHeader());

    expect(profileRepository.ensureForUserId).toHaveBeenCalledWith(USER_ID);
    expect(profileRepository.ensureForUserId).not.toHaveBeenCalledWith('another-user-id');
  });
});
