// cspell:ignore oksomu
/**
 * Canonical UpSkilr Resume Schema and Types
 * Based on Hugging Face oksomu/resume-ner entity extraction.
 */

export interface PersonalInfo {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
}

export interface ExperienceItem {
  title?: string;
  company?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}

export interface EducationItem {
  degree?: string;
  field?: string;
  institution?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}

export interface ProjectItem {
  name?: string;
  description?: string;
  technologies?: string[];
}

export interface CertificationItem {
  name?: string;
  issuer?: string;
  date?: string;
}

export interface StructuredResume {
  personal: PersonalInfo;
  summary?: string;
  skills: string[];
  experience: ExperienceItem[];
  education: EducationItem[];
  projects: ProjectItem[];
  certifications: CertificationItem[];
  languages: string[];
  achievements?: string[];
}

export interface RawNEREntity {
  entity: string;
  score: number;
  index: number;
  word: string;
  start?: number;
  end?: number;
}

export interface NormalizedEntities {
  names: string[];
  emails: string[];
  phones: string[];
  locations: string[];
  companies: string[];
  titles: string[];
  dates: string[];
  degrees: string[];
  fields: string[];
  institutions: string[];
  skills: string[];
  certs: string[];
  languages: string[];
}

export interface DetailedResumeAnalysis {
  overallScore: number;
  atsScore: number;
  targetRole?: string;
  skills: {
    detected: string[];
    strengths: string[];
    missing: string[];
  };
  experience: {
    years?: number;
    summary?: string;
  };
  education: {
    summary?: string;
  };
  projects: {
    count: number;
    strengths: string[];
  };
  recommendations: string[];
}
