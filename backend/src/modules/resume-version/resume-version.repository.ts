import { getSupabaseAdmin } from '../../config/supabase.js';
import { AppError } from '../../utils/errors.js';
import type { ResumeVersionRecord, ResumeVersionSource } from './resume-version.types.js';

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

  /**
   * Set a specific version as the single current active version for a resume,
   * clearing the current flag on all previous versions.
   */
  async setCurrentVersion(resumeId: string, versionId: string, userId: string): Promise<void> {
    try {
      // Step 1: Unmark all
      await getSupabaseAdmin()
        .from('resume_versions')
        .update({ is_current: false })
        .eq('resume_id', resumeId)
        .eq('user_id', userId);

      // Step 2: Mark targeted version
      await getSupabaseAdmin()
        .from('resume_versions')
        .update({ is_current: true })
        .eq('id', versionId)
        .eq('resume_id', resumeId)
        .eq('user_id', userId);
    } catch {
      // In case column is not yet present on remote DB, continue gracefully
    }
  }

  async create(input: {
    resumeId: string;
    userId: string;
    versionNumber: number;
    title: string;
    changesSummary: string;
    structuredData: unknown;
    score: number | null;
    source?: ResumeVersionSource;
    isCurrent?: boolean;
  }): Promise<ResumeVersionRecord> {
    const isCurrent = input.isCurrent ?? true;
    const source = input.source ?? 'ORIGINAL';

    // If this version is current, unmark previous current versions
    if (isCurrent) {
      try {
        await getSupabaseAdmin()
          .from('resume_versions')
          .update({ is_current: false })
          .eq('resume_id', input.resumeId)
          .eq('user_id', input.userId);
      } catch {
        // Ignored if column doesn't exist yet
      }
    }

    const payloadWithExtendedFields: Record<string, unknown> = {
      resume_id: input.resumeId,
      user_id: input.userId,
      version_number: input.versionNumber,
      title: input.title,
      changes_summary: input.changesSummary,
      structured_data: input.structuredData ?? null,
      score: input.score ?? null,
      source,
      is_current: isCurrent,
    };

    let { data, error } = await getSupabaseAdmin()
      .from('resume_versions')
      .insert(payloadWithExtendedFields)
      .select('*')
      .single();

    // Fallback if migration 019 has not been applied to remote db yet
    if (error && (error.message.includes('column "source"') || error.message.includes('column "is_current"'))) {
      const payloadLegacy = {
        resume_id: input.resumeId,
        user_id: input.userId,
        version_number: input.versionNumber,
        title: input.title,
        changes_summary: input.changesSummary,
        structured_data: input.structuredData ?? null,
        score: input.score ?? null,
      };

      const fallbackRes = await getSupabaseAdmin()
        .from('resume_versions')
        .insert(payloadLegacy)
        .select('*')
        .single();

      data = fallbackRes.data;
      error = fallbackRes.error;

      if (data) {
        (data as Record<string, unknown>).source = source;
        (data as Record<string, unknown>).is_current = isCurrent;
      }
    }

    if (error) {
      throw new AppError('Failed to create resume version', 500, 'DATABASE_ERROR');
    }

    const record = data as ResumeVersionRecord;
    if (record.source === undefined) record.source = source;
    if (record.is_current === undefined) record.is_current = isCurrent;

    return record;
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

    const records = (data ?? []) as ResumeVersionRecord[];
    // Normalize source and is_current if missing
    return records.map((r, index) => ({
      ...r,
      source: r.source ?? (r.version_number === 1 ? 'ORIGINAL' : 'MANUAL_EDIT'),
      is_current: r.is_current ?? (index === 0),
    }));
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

    if (!data) return null;
    const record = data as ResumeVersionRecord;
    return {
      ...record,
      source: record.source ?? (record.version_number === 1 ? 'ORIGINAL' : 'MANUAL_EDIT'),
      is_current: record.is_current ?? false,
    };
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
