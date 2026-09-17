import { authenticatedApiFetch } from '@/lib/api/client';
import type {
  AnalyzeJobResponse,
  JobAnalysisListResponse,
  ResumeDetailResponse,
  ResumeListResponse,
} from '@/features/resume/types/resume';

export async function listResumes(): Promise<ResumeListResponse> {
  return authenticatedApiFetch<ResumeListResponse>('/resumes');
}

export async function getResume(resumeId: string): Promise<ResumeDetailResponse> {
  return authenticatedApiFetch<ResumeDetailResponse>(`/resumes/${resumeId}`);
}

export async function uploadResume(file: File): Promise<ResumeDetailResponse> {
  const formData = new FormData();
  formData.append('file', file);

  return authenticatedApiFetch<ResumeDetailResponse>('/resumes', {
    method: 'POST',
    body: formData,
  });
}

export async function processResume(resumeId: string): Promise<ResumeDetailResponse> {
  return authenticatedApiFetch<ResumeDetailResponse>(`/resumes/${resumeId}/process`, {
    method: 'POST',
  });
}

export async function deleteResume(resumeId: string): Promise<void> {
  await authenticatedApiFetch<void>(`/resumes/${resumeId}`, {
    method: 'DELETE',
  });
}
