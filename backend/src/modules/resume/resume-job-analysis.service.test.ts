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
      findLatestByResumeForUser: vi.fn().mockResolvedValue({
        id: 'analysis-123',
        user_id: userId,
        resume_id: resumeId,
        match_score: 85,
        analysis_result: {
          matchScore: 85,
          category: 'Strong Match',
          overview: 'Strong candidate profile',
          breakdown: { skills: 85, experience: 80, responsibilities: 75, keywords: 70, education: 90, projects: 80 },
          matchedSkills: ['React', 'Node.js'],
          missingRequiredSkills: [],
          missingPreferredSkills: [],
          skillDetail: { matchedRequired: ['React', 'Node.js'], missingRequired: [], matchedPreferred: [], missingPreferred: [], scorePercent: 100 },
          experienceDetail: { requiredYears: null, detectedProfessionalYears: 2, detectedInternshipMonths: 0, detectedProjectCount: 1, matchLevel: 'strong', scorePercent: 80, note: '' },
          educationDetail: { required: [], detected: [], matchLevel: 'strong', scorePercent: 100 },
          responsibilityDetail: { matched: [], unmatched: [], scorePercent: 80 },
          keywordDetail: { found: [], missing: [], scorePercent: 80 },
          projectDetail: { relevantProjects: [], scorePercent: 50 },
          strengths: ['Strong skills'],
          recommendations: [],
        },
        created_at: new Date().toISOString(),
      }),
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

  it('retrieves the latest job analysis for a saved resume', async () => {
    const { service, jobAnalysisRepo } = createService();

    const result = await service.getLatestJobAnalysis(userId, resumeId);
    expect(result).not.toBeNull();
    expect(result?.success).toBe(true);
    expect(result?.analysisId).toBe('analysis-123');
    expect(result?.data.matchScore).toBe(85);
    expect(jobAnalysisRepo.findLatestByResumeForUser).toHaveBeenCalledWith(resumeId, userId);
  });

  it('preserves user data isolation by throwing 404 when unauthorized user accesses another users resume', async () => {
    const { service, resumeRepo } = createService();
    // Simulate User B attempting to access User A's resume
    vi.mocked(resumeRepo.findByIdForUser).mockResolvedValue(null);

    await expect(service.getLatestJobAnalysis('other-user-456', resumeId)).rejects.toThrow('Resume not found');
    await expect(service.listJobAnalyses('other-user-456', resumeId)).rejects.toThrow('Resume not found');
  });
});
