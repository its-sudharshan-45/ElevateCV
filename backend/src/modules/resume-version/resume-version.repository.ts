import { getSupabaseAdmin } from '../../config/supabase.js';
import { AppError } from '../../utils/errors.js';
import type { ResumeVersionRecord } from './resume-version.types.js';

export class ResumeVersionRepository {
  /** Return the highest existing version number for a resume, or 0 if none. */
  async getNextVersionNumber(resumeId: string): Promise<number> {
    const { data, error } = await getSupabaseAdmin()
      .from('resume_versions')
      .select('version_number')
      .eq('resume_id', resumeId)
      .order('version_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new AppError('Failed to determine next version number', 500, 'DATABASE_ERROR');
    }

    return data ? (data as { version_number: number }).version_number + 1 : 1;
  }

  async create(input: {
    resumeId: string;
    userId: string;
    versionNumber: number;
    title: string;
    changesSummary: string;
    structuredData: unknown;
    score: number | null;
  }): Promise<ResumeVersionRecord> {
    const { data, error } = await getSupabaseAdmin()
      .from('resume_versions')
      .insert({
        resume_id: input.resumeId,
        user_id: input.userId,
        version_number: input.versionNumber,
        title: input.title,
        changes_summary: input.changesSummary,
        structured_data: input.structuredData ?? null,
        score: input.score ?? null,
      })
      .select('*')
      .single();

    if (error) {
      throw new AppError('Failed to create resume version', 500, 'DATABASE_ERROR');
    }

    return data as ResumeVersionRecord;
  }

  async listForResume(resumeId: string, userId: string): Promise<ResumeVersionRecord[]> {
    const { data, error } = await getSupabaseAdmin()
      .from('resume_versions')
      .select('*')
      .eq('resume_id', resumeId)
      .eq('user_id', userId)
      .order('version_number', { ascending: false });

    if (error) {
      throw new AppError('Failed to list resume versions', 500, 'DATABASE_ERROR');
    }

    return (data ?? []) as ResumeVersionRecord[];
  }

  async findByIdForUser(versionId: string, userId: string): Promise<ResumeVersionRecord | null> {
    const { data, error } = await getSupabaseAdmin()
      .from('resume_versions')
      .select('*')
      .eq('id', versionId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      throw new AppError('Failed to retrieve resume version', 500, 'DATABASE_ERROR');
    }

    return data as ResumeVersionRecord | null;
  }

  async deleteByIdForUser(versionId: string, userId: string): Promise<boolean> {
    const existing = await this.findByIdForUser(versionId, userId);
    if (!existing) return false;

    const { error } = await getSupabaseAdmin()
      .from('resume_versions')
      .delete()
      .eq('id', versionId)
      .eq('user_id', userId);

    if (error) {
      throw new AppError('Failed to delete resume version', 500, 'DATABASE_ERROR');
    }

    return true;
  }
}

export const resumeVersionRepository = new ResumeVersionRepository();
