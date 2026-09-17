// cspell:ignore msword openxmlformats officedocument wordprocessingml
export const SUPPORTED_RESUME_MIME_TYPES = [
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/octet-stream',
] as const;

export const SUPPORTED_RESUME_EXTENSIONS = ['.pdf', '.txt', '.doc', '.docx'] as const;

export const SECTION_HEADING_PATTERNS: Record<string, RegExp[]> = {
  summary: [/^(professional\s+)?summary$/i, /^profile$/i, /^objective$/i, /^about(\s+me)?$/i],
  skills: [/^(technical\s+)?skills$/i, /^core\s+competencies$/i, /^technologies$/i],
  experience: [/^(work\s+)?experience$/i, /^employment(\s+history)?$/i, /^professional\s+experience$/i],
  education: [/^education$/i, /^academic(\s+background)?$/i],
  projects: [/^projects$/i, /^personal\s+projects$/i],
  certifications: [/^certifications$/i, /^licenses(\s+and\s+certifications)?$/i],
};

/**
 * Deterministic section weights for resume scoring (sum = 100).
 * Each section score is proportional to detected content quality.
 */
export const SECTION_SCORE_WEIGHTS: Record<
  'summary' | 'skills' | 'experience' | 'education' | 'projects' | 'certifications',
  number
> = {
  summary: 15,
  skills: 20,
  experience: 25,
  education: 15,
  projects: 15,
  certifications: 10,
};

export const MIN_RESUME_SCORE = 0;
export const MAX_RESUME_SCORE = 100;
