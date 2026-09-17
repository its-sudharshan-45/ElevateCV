import { AppError } from '../../utils/errors.js';
import { mapProfileToResponse, mapUpdateInputToData } from './profile.mapper.js';
import { profileRepository, ProfileRepository } from './profile.repository.js';
import type { ProfileResponse, UpdateProfileInput } from './profile.types.js';

export class ProfileService {
  constructor(private readonly repository: ProfileRepository = profileRepository) {}

  async getProfile(userId: string): Promise<ProfileResponse> {
    // Auth trigger creates profiles on signup; ensure covers race/miss cases.
    const profile = await this.repository.ensureForUserId(userId);
    return mapProfileToResponse(profile);
  }

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<ProfileResponse> {
    const updates = mapUpdateInputToData(input);

    if (Object.keys(updates).length === 0) {
      throw new AppError('At least one field must be provided', 400, 'VALIDATION_ERROR');
    }

    const profile = await this.repository.updateByUserId(userId, updates);
    return mapProfileToResponse(profile);
  }
}

export const profileService = new ProfileService();
