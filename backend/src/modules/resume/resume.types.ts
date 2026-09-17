export const RESUME_PROCESSING_STATUSES = [
  'UPLOADED',
  'PROCESSING',
  'PROCESSED',
  'FAILED',
] as const;

export type ResumeProcessingStatus = (typeof RESUME_PROCESSING_STATUSES)[number];

export const RESUME_SECTION_KEYS = [
  'summary',
  'skills',
  'experience',
  'education',
  'projects',
  'certifications',
  'other',
] as const;

export type ResumeSectionKey = (typeof RESUME_SECTION_KEYS)[number];

export interface ResumeSection {
  key: ResumeSectionKey;
  title: string;
  content: string;
}

export interface StructuredResumeData {
  sections: ResumeSection[];
  skills: string[];
  structuredResume?: import('../../ai/resume/resume-types.js').StructuredResume;
}

export interface SectionAnalysis {
  key: ResumeSectionKey;
  present: boolean;
  itemCount: number;
  score: number;
  maxScore: number;
  feedback: string;
}

export interface ResumeAnalysis {
  completenessScore: number;
  sectionAnalyses: SectionAnalysis[];
  skillCount: number;
  duplicateSkillCount: number;
  suggestions: string[];
  // Extended Hugging Face NER Analysis
  overallScore?: number;
  atsScore?: number;
  targetRole?: string;
  detailedAnalysis?: import('../../ai/resume/resume-types.js').DetailedResumeAnalysis;
}

export interface ResumeRecord {
  id: string;
  user_id: string;
  original_filename: string;
  storage_path: string;
  mime_type: string;
  file_size: number;
  processing_status: ResumeProcessingStatus;
  extracted_text: string | null;
  structured_data: StructuredResumeData | null;
  analysis_result: ResumeAnalysis | null;
  score: number | null;
  failure_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface ResumeListItemResponse {
  id: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  processingStatus: ResumeProcessingStatus;
  score: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ResumeDetailResponse extends ResumeListItemResponse {
  extractedText: string | null;
  structuredData: StructuredResumeData | null;
  analysisResult: ResumeAnalysis | null;
  failureReason: string | null;
}

export interface CreateResumeInput {
  id: string;
  userId: string;
  originalFilename: string;
  storagePath: string;
  mimeType: string;
  fileSize: number;
}

export interface UpdateResumeProcessingInput {
  processingStatus: ResumeProcessingStatus;
  extractedText?: string | null;
  structuredData?: StructuredResumeData | null;
  analysisResult?: ResumeAnalysis | null;
  score?: number | null;
  failureReason?: string | null;
}
