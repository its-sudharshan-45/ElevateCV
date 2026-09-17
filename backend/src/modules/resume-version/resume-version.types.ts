import type { StructuredResumeData } from '../resume/resume.types.js';

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
  changesSummary: string;
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
  createdAt: string;
  updatedAt: string;
}

/** Skill-level diff between two versions */
export interface SkillDiff {
  added: string[];
  removed: string[];
  unchanged: string[];
}

/** Full comparison result computed in the service layer */
export interface ResumeVersionComparisonResponse {
  versionA: ResumeVersionResponse;
  versionB: ResumeVersionResponse;
  scoreDelta: number | null;
  skillDiff: SkillDiff;
}
