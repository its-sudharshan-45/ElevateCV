import { optimizeResume } from '../../ai/optimization/resume-optimizer.js';
import type { OptimizationResult } from '../../ai/optimization/optimization-types.js';
import type { JobMatchAnalysis } from '../../ai/job/job-types.js';
import type { StructuredResume } from '../../ai/resume/resume-types.js';
import { AppError } from '../../utils/errors.js';
import { ResumeRepository, resumeRepository } from './resume.repository.js';
import {
  ResumeJobAnalysisRepository,
  resumeJobAnalysisRepository,
} from './resume-job-analysis.repository.js';
import { optimizeResumeSchema } from './resume-job-analysis.types.js';

export class ResumeOptimizationService {
  constructor(
    private readonly resumeRepo: ResumeRepository = resumeRepository,
    private readonly jobAnalysisRepo: ResumeJobAnalysisRepository = resumeJobAnalysisRepository,
  ) {}

  async optimizeResume(
    userId: string,
    resumeId: string,
    analysisId: string,
  ): Promise<OptimizationResult> {
    // 1. Validate analysisId format
    optimizeResumeSchema.parse({ analysisId });

    // 2. Fetch resume and verify ownership
    const resumeRecord = await this.resumeRepo.findByIdForUser(resumeId, userId);
    if (!resumeRecord) {
      throw new AppError('Resume not found', 404, 'NOT_FOUND');
    }

    // 3. Ensure resume has been processed
    if (resumeRecord.processing_status !== 'PROCESSED') {
      throw new AppError(
        'Resume must be fully processed before optimization',
        400,
        'VALIDATION_ERROR',
      );
    }

    // 4. Fetch the job analysis and verify ownership
    const analysisRecord = await this.jobAnalysisRepo.findByIdForUser(analysisId, userId);
    if (!analysisRecord) {
      throw new AppError('Job analysis not found', 404, 'NOT_FOUND');
    }

    // 5. Verify analysis belongs to the same resume
    if (analysisRecord.resume_id !== resumeId) {
      throw new AppError(
        'Job analysis does not belong to the specified resume',
        400,
        'VALIDATION_ERROR',
      );
    }

    // 6. Extract structured resume — required for grounded optimization
    let structuredResume = resumeRecord.structured_data
      ?.structuredResume as StructuredResume | undefined;

    if (!structuredResume) {
      const sections = resumeRecord.structured_data?.sections ?? [];
      const skills = resumeRecord.structured_data?.skills ?? [];
      if (sections.length > 0 || skills.length > 0) {
        structuredResume = {
          personal: {},
          summary: sections.find((s) => s.key === 'summary')?.content,
          skills,
          experience: [],
          education: [],
          projects: [],
          certifications: [],
          languages: [],
        };
      }
    }

    if (!structuredResume) {
      throw new AppError(
        'Structured resume data is unavailable. Please reprocess the resume.',
        400,
        'VALIDATION_ERROR',
      );
    }

    // 7. Extract ATS analysis from the job analysis record
    const atsAnalysis = analysisRecord.analysis_result as unknown as JobMatchAnalysis | null;
    if (!atsAnalysis) {
      throw new AppError(
        'Job analysis data is unavailable. Please re-run the ATS analysis.',
        400,
        'VALIDATION_ERROR',
      );
    }

    // 8. Extract raw resume text (used for full context in prompt)
    const rawResumeText = resumeRecord.extracted_text ?? '';

    // 9. Extract job description from analysis record
    const jobDescription = analysisRecord.job_description;

    // 10. Run AI optimization — original resume is NEVER mutated
    return optimizeResume(structuredResume, atsAnalysis, rawResumeText, jobDescription);
  }
}

export const resumeOptimizationService = new ResumeOptimizationService();
