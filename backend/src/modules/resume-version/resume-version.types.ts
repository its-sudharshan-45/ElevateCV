import type { StructuredResumeData } from '../resume/resume.types.js';

// ---------------------------------------------------------------------------
// Version Origin / Source
// ---------------------------------------------------------------------------

export const RESUME_VERSION_SOURCES = [
  'ORIGINAL',
  'AI_OPTIMIZED',
  'MANUAL_EDIT',
  'RESTORED',
] as const;

export type ResumeVersionSource = (typeof RESUME_VERSION_SOURCES)[number];

// ---------------------------------------------------------------------------
// DB record
// ---------------------------------------------------------------------------

export interface ResumeVersionRecord {
  id: string;
  resume_id: string;
  user_id: string;
  version_number: number;
  title: string;
  changes_summary: string;
  structured_data: StructuredResumeData | null;
  score: number | null;
  source?: ResumeVersionSource;
  is_current?: boolean;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Input / command types
// ---------------------------------------------------------------------------

export interface CreateResumeVersionInput {
  resumeId: string;
  userId: string;
  title: string;
  changesSummary?: string;
  source?: ResumeVersionSource;
  structuredData?: StructuredResumeData | null;
  score?: number | null;
}

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

export interface ResumeVersionResponse {
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

/** Skill-level diff between two versions */
export interface SkillDiff {
  added: string[];
  removed: string[];
  unchanged: string[];
}

/** Summary text diff */
export interface SummaryDiff {
  versionA: string;
  versionB: string;
  isModified: boolean;
}

/** Item list diff (experience, projects, education, certs) */
export interface SectionItemDiff {
  added: string[];
  removed: string[];
  modified: { name: string; details: string }[];
}

/** Full comprehensive section diff */
export interface ResumeSectionDiff {
  summary: SummaryDiff;
  skills: SkillDiff;
  experience: SectionItemDiff;
  projects: SectionItemDiff;
  education: SectionItemDiff;
  certifications: SectionItemDiff;
  overview: string;
}

/** Full comparison result computed in the service layer */
export interface ResumeVersionComparisonResponse {
  versionA: ResumeVersionResponse;
  versionB: ResumeVersionResponse;
  scoreDelta: number | null;
  skillDiff: SkillDiff;
  sectionDiff: ResumeSectionDiff;
}
