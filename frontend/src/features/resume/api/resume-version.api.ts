import { authenticatedApiFetch } from '@/lib/api/client';
import type { ResumeVersionSource, StructuredResumeData } from '../types/resume';

export interface ResumeVersion {
  id: string;
  resumeId: string;
  userId: string;
  versionNumber: number;
  title: string;
  changesSummary: string;
  structuredData: StructuredResumeData | null;
  score: number | null;
  source: ResumeVersionSource;
  isCurrent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SkillDiff {
  added: string[];
  removed: string[];
  unchanged: string[];
}

export interface SummaryDiff {
  versionA: string;
  versionB: string;
  isModified: boolean;
}

export interface SectionItemDiff {
  added: string[];
  removed: string[];
  modified: { name: string; details: string }[];
}

export interface ResumeSectionDiff {
  summary: SummaryDiff;
  skills: SkillDiff;
  experience: SectionItemDiff;
  projects: SectionItemDiff;
  education: SectionItemDiff;
  certifications: SectionItemDiff;
  overview: string;
}

export interface ResumeVersionComparison {
  versionA: ResumeVersion;
  versionB: ResumeVersion;
  scoreDelta: number | null;
  skillDiff: SkillDiff;
  sectionDiff?: ResumeSectionDiff;
}

export async function listResumeVersions(resumeId: string) {
  return authenticatedApiFetch<{ versions: ResumeVersion[] }>(`/resumes/${resumeId}/versions`);
}

export async function createResumeVersion(
  resumeId: string,
  title: string,
  changesSummary = '',
  source: ResumeVersionSource = 'MANUAL_EDIT',
  structuredData?: StructuredResumeData | null,
  score?: number | null,
) {
  return authenticatedApiFetch<{ version: ResumeVersion }>(`/resumes/${resumeId}/versions`, {
    method: 'POST',
    body: JSON.stringify({
      title,
      changesSummary,
      source,
      structuredData,
      score,
    }),
  });
}

export async function restoreResumeVersion(resumeId: string, versionId: string) {
  return authenticatedApiFetch<{ version: ResumeVersion }>(
    `/resumes/${resumeId}/versions/${versionId}/restore`,
    {
      method: 'POST',
    },
  );
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
