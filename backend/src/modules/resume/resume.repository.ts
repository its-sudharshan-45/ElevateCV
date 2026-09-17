import { getSupabaseAdmin } from '../../config/supabase.js';
import { AppError } from '../../utils/errors.js';
import type {
  CreateResumeInput,
  ResumeRecord,
  UpdateResumeProcessingInput,
} from './resume.types.js';

export class ResumeRepository {
  async create(input: CreateResumeInput): Promise<ResumeRecord> {
    const { data, error } = await getSupabaseAdmin()
      .from('resumes')
      .insert({
        id: input.id,
        user_id: input.userId,
        original_filename: input.originalFilename,
        storage_path: input.storagePath,
        mime_type: input.mimeType,
        file_size: input.fileSize,
        processing_status: 'UPLOADED',
      })
      .select('*')
      .single();

    if (error) {
      throw new AppError('Failed to create resume record', 500, 'DATABASE_ERROR');
    }

    return data as ResumeRecord;
  }

  async findByIdForUser(resumeId: string, userId: string): Promise<ResumeRecord | null> {
    const { data, error } = await getSupabaseAdmin()
      .from('resumes')
      .select('*')
      .eq('id', resumeId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      throw new AppError('Failed to retrieve resume', 500, 'DATABASE_ERROR');
    }

    return data as ResumeRecord | null;
  }

  async listByUserId(userId: string): Promise<ResumeRecord[]> {
    const { data, error } = await getSupabaseAdmin()
      .from('resumes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new AppError('Failed to list resumes', 500, 'DATABASE_ERROR');
    }

    return (data ?? []) as ResumeRecord[];
  }

  async updateProcessing(
    resumeId: string,
    userId: string,
    input: UpdateResumeProcessingInput,
  ): Promise<ResumeRecord> {
    const { data, error } = await getSupabaseAdmin()
      .from('resumes')
      .update({
        processing_status: input.processingStatus,
        extracted_text: input.extractedText,
        structured_data: input.structuredData,
        analysis_result: input.analysisResult,
        score: input.score,
        failure_reason: input.failureReason,
      })
      .eq('id', resumeId)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new AppError('Resume not found', 404, 'NOT_FOUND');
      }
      throw new AppError('Failed to update resume', 500, 'DATABASE_ERROR');
    }

    return data as ResumeRecord;
  }

  async deleteByIdForUser(resumeId: string, userId: string): Promise<ResumeRecord | null> {
    const existing = await this.findByIdForUser(resumeId, userId);
    if (!existing) {
      return null;
    }

    const { error } = await getSupabaseAdmin()
      .from('resumes')
      .delete()
      .eq('id', resumeId)
      .eq('user_id', userId);

    if (error) {
      throw new AppError('Failed to delete resume', 500, 'DATABASE_ERROR');
    }

    return existing;
  }
}

export const resumeRepository = new ResumeRepository();
