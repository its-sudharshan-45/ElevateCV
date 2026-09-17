import { authenticatedApiFetch } from '@/lib/api/client';
import type { Profile, ProfileResponse } from '@/types/profile';

export async function getProfile(): Promise<ProfileResponse> {
  return authenticatedApiFetch<ProfileResponse>('/profile');
}

export async function updateProfile(payload: Partial<Profile>): Promise<ProfileResponse> {
  return authenticatedApiFetch<ProfileResponse>('/profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}
