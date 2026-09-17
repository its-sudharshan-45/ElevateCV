import { authenticatedApiFetch } from '@/lib/api/client';
import type {
  AnalyzeJobResponse,
  JobAnalysisListResponse,
  ResumeDetailResponse,
  ResumeListResponse,
} from '@/features/resume/types/resume';

export async function listResumes() {
  return authenticatedApiFetch<ResumeListResponse>('/resumes');
}

export async function getResume(resumeId: string) {
  return authenticatedApiFetch<ResumeDetailResponse>(`/resumes/${resumeId}`);
}

export async function uploadResume(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  return authenticatedApiFetch<ResumeDetailResponse>('/resumes', {
    method: 'POST',
    body: formData,
  });
}

export async function processResume(resumeId: string) {
  return authenticatedApiFetch<ResumeDetailResponse>(`/resumes/${resumeId}/process`, {
    method: 'POST',
  });
}

export async function deleteResume(resumeId: string) {
  await authenticatedApiFetch<void>(`/resumes/${resumeId}`, {
    method: 'DELETE',
  });
}

export async function analyzeResumeForJob(
  resumeId: string,
  jobDescription: string,
  jobTitle?: string,
) {
  return authenticatedApiFetch<AnalyzeJobResponse>(`/resumes/${resumeId}/analyze-job`, {
    method: 'POST',
    body: JSON.stringify({
      jobDescription,
      jobTitle: jobTitle?.trim() || undefined,
    }),
  });
}

export async function listJobAnalyses(resumeId: string) {
  return authenticatedApiFetch<JobAnalysisListResponse>(`/resumes/${resumeId}/job-analyses`);
}

