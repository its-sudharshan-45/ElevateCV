import { authenticatedApiFetch } from '@/lib/api/client';
import type {
  ResumeVersion,
  ResumeVersionComparison,
} from '@/features/resume/api/resume-version.api';

export type { ResumeVersion, ResumeVersionComparison };

export async function listResumeVersions(resumeId: string): Promise<{ versions: ResumeVersion[] }> {
  return authenticatedApiFetch<{ versions: ResumeVersion[] }>(`/resumes/${resumeId}/versions`);
}

export async function createResumeVersion(
  resumeId: string,
  title: string,
  changesSummary: string,
): Promise<{ version: ResumeVersion }> {
  return authenticatedApiFetch<{ version: ResumeVersion }>(`/resumes/${resumeId}/versions`, {
    method: 'POST',
    body: JSON.stringify({ title, changesSummary }),
  });
}

export async function compareResumeVersions(
  resumeId: string,
  versionA: string,
  versionB: string,
): Promise<{ comparison: ResumeVersionComparison }> {
  const params = new URLSearchParams({ versionA, versionB });
  return authenticatedApiFetch<{ comparison: ResumeVersionComparison }>(
    `/resumes/${resumeId}/versions/compare?${params.toString()}`,
  );
}

export async function deleteResumeVersion(resumeId: string, versionId: string): Promise<void> {
  await authenticatedApiFetch<void>(`/resumes/${resumeId}/versions/${versionId}`, {
    method: 'DELETE',
  });
}
