import { authenticatedApiFetch } from '@/lib/api/client';
import type { StructuredResumeData } from '../types/resume';

export interface ResumeVersion {
  id: string;
  resumeId: string;
  userId: string;
  versionNumber: number;
  title: string;
  changesSummary: string;
  structuredData: StructuredResumeData | null;
  score: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface SkillDiff {
  added: string[];
  removed: string[];
  unchanged: string[];
}

export interface ResumeVersionComparison {
  versionA: ResumeVersion;
  versionB: ResumeVersion;
  scoreDelta: number | null;
  skillDiff: SkillDiff;
}

export async function listResumeVersions(resumeId: string) {
  return authenticatedApiFetch<{ versions: ResumeVersion[] }>(`/resumes/${resumeId}/versions`);
}

export async function createResumeVersion(
  resumeId: string,
  title: string,
  changesSummary: string,
) {
  return authenticatedApiFetch<{ version: ResumeVersion }>(`/resumes/${resumeId}/versions`, {
    method: 'POST',
    body: JSON.stringify({ title, changesSummary }),
  });
}

export async function compareResumeVersions(
  resumeId: string,
  versionA: string,
  versionB: string,
) {
  const params = new URLSearchParams({ versionA, versionB });
  return authenticatedApiFetch<{ comparison: ResumeVersionComparison }>(
    `/resumes/${resumeId}/versions/compare?${params.toString()}`,
  );
}

export async function deleteResumeVersion(resumeId: string, versionId: string) {
  await authenticatedApiFetch<void>(`/resumes/${resumeId}/versions/${versionId}`, {
    method: 'DELETE',
  });
}
