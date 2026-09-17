import { getSupabaseAdmin } from '../../config/supabase.js';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/errors.js';
import { logger } from '../../config/logger.js';

export class ResumeStorageService {
  async uploadObject(storagePath: string, buffer: Buffer, mimeType: string): Promise<void> {
    const { error } = await getSupabaseAdmin()
      .storage
      .from(env.RESUME_STORAGE_BUCKET)
      .upload(storagePath, buffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) {
      logger.error({ storagePath, code: error.message }, 'Resume storage upload failed');
      throw new AppError('Failed to store resume file', 500, 'EXTERNAL_SERVICE_ERROR');
    }
  }

  async downloadObject(storagePath: string): Promise<Buffer> {
    const { data, error } = await getSupabaseAdmin()
      .storage
      .from(env.RESUME_STORAGE_BUCKET)
      .download(storagePath);

    if (error || !data) {
      logger.error({ storagePath, code: error?.message }, 'Resume storage download failed');
      throw new AppError('Failed to retrieve resume file', 500, 'EXTERNAL_SERVICE_ERROR');
    }

    const arrayBuffer = await data.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  async deleteObject(storagePath: string): Promise<void> {
    const { error } = await getSupabaseAdmin()
      .storage
      .from(env.RESUME_STORAGE_BUCKET)
      .remove([storagePath]);

    if (error) {
      logger.error({ storagePath, code: error.message }, 'Resume storage delete failed');
      throw new AppError('Failed to delete resume file', 500, 'EXTERNAL_SERVICE_ERROR');
    }
  }
}

export const resumeStorageService = new ResumeStorageService();
