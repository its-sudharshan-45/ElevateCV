import { authenticatedApiFetch } from '@/lib/api/client';
import type {
  AnalyzeJobResponse,
  JobAnalysisListResponse,
} from '@/features/resume/types/resume';

export async function analyzeResumeForJob(
  resumeId: string,
  jobDescription: string,
  jobTitle?: string,
): Promise<AnalyzeJobResponse> {
  return authenticatedApiFetch<AnalyzeJobResponse>(`/resumes/${resumeId}/analyze-job`, {
    method: 'POST',
    body: JSON.stringify({
      jobDescription,
      jobTitle: jobTitle?.trim() || undefined,
    }),
  });
}

export async function listJobAnalyses(resumeId: string): Promise<JobAnalysisListResponse> {
  return authenticatedApiFetch<JobAnalysisListResponse>(`/resumes/${resumeId}/job-analyses`);
}
