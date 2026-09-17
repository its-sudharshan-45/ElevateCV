import { getSupabaseAdmin } from '../../config/supabase.js';
import { AppError } from '../../utils/errors.js';
import type { ProfileRecord, UpdateProfileData } from './profile.types.js';

export class ProfileRepository {
  async findByUserId(userId: string): Promise<ProfileRecord | null> {
    const { data, error } = await getSupabaseAdmin()
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      throw new AppError('Failed to retrieve profile', 500, 'DATABASE_ERROR');
    }

    return data as ProfileRecord | null;
  }

  async ensureForUserId(userId: string): Promise<ProfileRecord> {
    const existing = await this.findByUserId(userId);

    if (existing) {
      return existing;
    }

    const { error: insertError } = await getSupabaseAdmin().from('profiles').insert({ id: userId });

    // 23505 = unique_violation (auth trigger may have inserted concurrently)
    if (insertError && insertError.code !== '23505') {
      const retryAfterError = await this.findByUserId(userId);

      if (retryAfterError) {
        return retryAfterError;
      }

      throw new AppError('Failed to synchronize profile', 500, 'DATABASE_ERROR');
    }

    const created = await this.findByUserId(userId);

    if (!created) {
      throw new AppError('Failed to synchronize profile', 500, 'DATABASE_ERROR');
    }

    return created;
  }

  async updateByUserId(userId: string, updates: UpdateProfileData): Promise<ProfileRecord> {
    await this.ensureForUserId(userId);

    const { data, error } = await getSupabaseAdmin()
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select('*')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new AppError('Profile not found', 404, 'NOT_FOUND');
      }

      throw new AppError('Failed to update profile', 500, 'DATABASE_ERROR');
    }

    return data as ProfileRecord;
  }
}

export const profileRepository = new ProfileRepository();
