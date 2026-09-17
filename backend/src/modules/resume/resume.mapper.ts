import type {
  ResumeDetailResponse,
  ResumeListItemResponse,
  ResumeRecord,
} from './resume.types.js';

export function mapResumeToListItem(record: ResumeRecord): ResumeListItemResponse {
  return {
    id: record.id,
    originalFilename: record.original_filename,
    mimeType: record.mime_type,
    fileSize: record.file_size,
    processingStatus: record.processing_status,
    score: record.score,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

export function mapResumeToDetail(record: ResumeRecord): ResumeDetailResponse {
  return {
    ...mapResumeToListItem(record),
    extractedText: record.extracted_text,
    structuredData: record.structured_data,
    analysisResult: record.analysis_result,
    failureReason: record.failure_reason,
  };
}
