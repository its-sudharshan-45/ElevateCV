import { randomUUID } from 'node:crypto';
import { getSupabaseAdmin } from '../../config/supabase.js';
import { AppError } from '../../utils/errors.js';
import type { JobMatchAnalysis, JobRequirements } from '../../ai/job/job-types.js';
import type {
  JobAnalysisListItem,
  ResumeJobAnalysisRecord,
} from './resume-job-analysis.types.js';
import { getMatchCategory } from '../../ai/job/job-types.js';

export class ResumeJobAnalysisRepository {
  async create(input: {
    userId: string;
    resumeId: string;
    jobTitle?: string;
    jobDescription: string;
    jobRequirements: JobRequirements;
    matchScore: number;
    analysisResult: JobMatchAnalysis;
  }): Promise<ResumeJobAnalysisRecord> {
    const { data, error } = await getSupabaseAdmin()
      .from('resume_job_analysis')
      .insert({
        id: randomUUID(),
        user_id: input.userId,
        resume_id: input.resumeId,
        job_title: input.jobTitle ?? null,
        job_description: input.jobDescription,
        job_requirements: input.jobRequirements as unknown as Record<string, unknown>,
        match_score: input.matchScore,
        analysis_result: input.analysisResult as unknown as Record<string, unknown>,
      })
      .select('*')
      .single();

    if (error) {
      throw new AppError('Failed to save job analysis', 500, 'DATABASE_ERROR');
    }

    return data as ResumeJobAnalysisRecord;
  }

  async listByResumeForUser(resumeId: string, userId: string): Promise<JobAnalysisListItem[]> {
    const { data, error } = await getSupabaseAdmin()
      .from('resume_job_analysis')
      .select('id, resume_id, job_title, match_score, created_at')
      .eq('resume_id', resumeId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new AppError('Failed to list job analyses', 500, 'DATABASE_ERROR');
    }

    return (data ?? []).map((row) => ({
      id: row.id as string,
      resumeId: row.resume_id as string,
      jobTitle: row.job_title as string | null,
      matchScore: row.match_score as number,
      category: getMatchCategory(row.match_score as number),
      createdAt: row.created_at as string,
    }));
  }

  async findByIdForUser(
    analysisId: string,
    userId: string,
  ): Promise<ResumeJobAnalysisRecord | null> {
    const { data, error } = await getSupabaseAdmin()
      .from('resume_job_analysis')
      .select('*')
      .eq('id', analysisId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      throw new AppError('Failed to retrieve job analysis', 500, 'DATABASE_ERROR');
    }

    return data as ResumeJobAnalysisRecord | null;
  }

  async findLatestByResumeForUser(
    resumeId: string,
    userId: string,
  ): Promise<ResumeJobAnalysisRecord | null> {
    const { data, error } = await getSupabaseAdmin()
      .from('resume_job_analysis')
      .select('*')
      .eq('resume_id', resumeId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new AppError('Failed to retrieve latest job analysis', 500, 'DATABASE_ERROR');
    }

    return data as ResumeJobAnalysisRecord | null;
  }
}

export const resumeJobAnalysisRepository = new ResumeJobAnalysisRepository();
