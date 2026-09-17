import { describe, expect, it, vi } from 'vitest';
import { ResumeJobAnalysisService } from './resume-job-analysis.service.js';
import type { ResumeRepository } from './resume.repository.js';
import type { ResumeJobAnalysisRepository } from './resume-job-analysis.repository.js';
import type { ResumeRecord } from './resume.types.js';
import { AppError } from '../../utils/errors.js';

describe('ResumeJobAnalysisService', () => {
  const userId = 'user-123';
  const resumeId = '123e4567-e89b-12d3-a456-426614174000';

  const mockResume: ResumeRecord = {
    id: resumeId,
    user_id: userId,
    original_filename: 'resume.pdf',
    storage_path: 'resumes/resume.pdf',
    mime_type: 'application/pdf',
    file_size: 1024,
    processing_status: 'PROCESSED',
    extracted_text: 'Experienced React and Node.js developer',
    structured_data: {
      sections: [],
      skills: ['React', 'Node.js', 'PostgreSQL'],
      structuredResume: {
        personal: { name: 'Dev', email: 'dev@example.com' },
        skills: ['React', 'Node.js', 'PostgreSQL'],
        experience: [{ title: 'Full Stack Dev', company: 'Tech Corp' }],
        education: [{ degree: 'B.Tech', field: 'CS' }],
        projects: [{ name: 'App', technologies: ['React', 'Node.js'] }],
        certifications: [],
        languages: [],
      },
    },
    analysis_result: null,
    score: 85,
    failure_reason: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const createService = (overrides?: {
    resumeRecord?: ResumeRecord | null;
  }) => {
    const resumeRepo = {
      findByIdForUser: vi.fn().mockResolvedValue(
        overrides?.resumeRecord !== undefined ? overrides.resumeRecord : mockResume,
      ),
      updateProcessing: vi.fn().mockResolvedValue(mockResume),
    } as unknown as ResumeRepository;

    const jobAnalysisRepo = {
      create: vi.fn().mockResolvedValue({
        id: 'analysis-123',
        user_id: userId,
        resume_id: resumeId,
        job_title: 'Full Stack Dev',
        match_score: 85,
        created_at: new Date().toISOString(),
      }),
      listByResumeForUser: vi.fn().mockResolvedValue([
        {
          id: 'analysis-123',
          resumeId,
          jobTitle: 'Full Stack Dev',
          matchScore: 85,
          category: 'Strong Match',
          createdAt: new Date().toISOString(),
        },
      ]),
    } as unknown as ResumeJobAnalysisRepository;

    const service = new ResumeJobAnalysisService(resumeRepo, jobAnalysisRepo);
    return { service, resumeRepo, jobAnalysisRepo };
  };

  it('runs job analysis successfully and saves record', async () => {
    const { service, jobAnalysisRepo } = createService();

    const response = await service.analyzeResumeForJob(userId, {
      resumeId,
      jobTitle: 'Full Stack Engineer',
      jobDescription: 'Seeking Full Stack Engineer with React, Node.js, and PostgreSQL expertise.',
    });

    expect(response.success).toBe(true);
    expect(response.data.matchScore).toBeGreaterThanOrEqual(0);
    expect(response.data.matchScore).toBeLessThanOrEqual(100);
    expect(response.data.matchedSkills).toContain('React');
    expect(response.analysisId).toBe('analysis-123');
    expect(jobAnalysisRepo.create).toHaveBeenCalled();
  });

  it('throws 404 if resume not found', async () => {
    const { service } = createService({ resumeRecord: null });

    await expect(
      service.analyzeResumeForJob(userId, {
        resumeId,
        jobDescription: 'Seeking developer with React skills.',
      }),
    ).rejects.toThrow(AppError);
  });

  it('throws 400 if resume is not in PROCESSED status', async () => {
    const { service } = createService({
      resumeRecord: { ...mockResume, processing_status: 'UPLOADED' },
    });

    await expect(
      service.analyzeResumeForJob(userId, {
        resumeId,
        jobDescription: 'Seeking developer with React skills.',
      }),
    ).rejects.toThrow('Resume must be fully processed before running job analysis');
  });

  it('lists job analyses for valid resume', async () => {
    const { service, jobAnalysisRepo } = createService();

    const list = await service.listJobAnalyses(userId, resumeId);
    expect(list.length).toBe(1);
    expect(list[0].id).toBe('analysis-123');
    expect(jobAnalysisRepo.listByResumeForUser).toHaveBeenCalledWith(resumeId, userId);
  });
});
