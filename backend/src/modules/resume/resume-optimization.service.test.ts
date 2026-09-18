import { describe, expect, it, vi } from 'vitest';
import { ResumeOptimizationService } from './resume-optimization.service.js';
import type { ResumeRepository } from './resume.repository.js';
import type { ResumeJobAnalysisRepository } from './resume-job-analysis.repository.js';
import type { ResumeRecord } from './resume.types.js';
import { AppError } from '../../utils/errors.js';
import { AiService } from '../../ai/ai.service.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const userId = 'user-abc';
const resumeId = '123e4567-e89b-12d3-a456-426614174000';
const analysisId = '223e4567-e89b-12d3-a456-426614174001';

const mockResume: ResumeRecord = {
  id: resumeId,
  user_id: userId,
  original_filename: 'resume.pdf',
  storage_path: 'resumes/resume.pdf',
  mime_type: 'application/pdf',
  file_size: 2048,
  processing_status: 'PROCESSED',
  extracted_text: 'Experienced React and Node.js developer.',
  structured_data: {
    sections: [],
    skills: ['React', 'Node.js'],
    structuredResume: {
      personal: { name: 'Dev', email: 'dev@example.com' },
      summary: 'Full-stack developer.',
      skills: ['React', 'Node.js'],
      experience: [{ title: 'Engineer', company: 'Corp', description: 'Built APIs.' }],
      education: [{ degree: 'B.Tech', field: 'CS', institution: 'State Uni' }],
      projects: [{ name: 'App', technologies: ['React'], description: 'Portfolio.' }],
      certifications: [],
      languages: [],
    },
  },
  analysis_result: null,
  score: 70,
  failure_reason: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockAnalysisRecord = {
  id: analysisId,
  user_id: userId,
  resume_id: resumeId,
  job_title: 'Full Stack Engineer',
  job_description: 'Seeking a React and Node.js developer with Docker and AWS experience.',
  job_requirements: {},
  match_score: 70,
  analysis_result: {
    matchScore: 70,
    category: 'Good Match',
    overview: 'Candidate has strong frontend skills.',
    breakdown: { skills: 70, experience: 65, responsibilities: 60, keywords: 50, education: 90, projects: 65 },
    matchedSkills: ['React', 'Node.js'],
    missingRequiredSkills: ['Docker', 'AWS'],
    missingPreferredSkills: [],
    skillDetail: { matchedRequired: ['React', 'Node.js'], missingRequired: ['Docker', 'AWS'], matchedPreferred: [], missingPreferred: [], scorePercent: 70 },
    experienceDetail: { requiredYears: 3, detectedProfessionalYears: 2, detectedInternshipMonths: 0, detectedProjectCount: 1, matchLevel: 'partial', scorePercent: 65, note: '' },
    educationDetail: { required: [], detected: [], matchLevel: 'strong', scorePercent: 90 },
    responsibilityDetail: { matched: [], unmatched: ['Deploy containers'], scorePercent: 60 },
    keywordDetail: { found: ['React'], missing: ['CI/CD', 'Kubernetes'], scorePercent: 50 },
    projectDetail: { relevantProjects: [], scorePercent: 65 },
    strengths: ['React expertise'],
    recommendations: [{ priority: 'high', text: 'Add Docker experience', impact: 'High ATS impact' }],
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const validAiResponse = JSON.stringify({
  optimizedSections: [
    {
      key: 'summary',
      original: 'Full-stack developer.',
      improved: 'Full-stack developer specializing in React and Node.js, with experience building scalable REST APIs.',
      reason: 'Aligned with job description keywords.',
    },
  ],
  suggestions: [
    { priority: 'high', text: 'Consider gaining Docker experience.', impact: 'Addresses top missing skill.' },
  ],
  keywordImprovements: [
    { keyword: 'CI/CD', suggestion: 'Mention CI/CD workflows if applicable in your experience.' },
  ],
  warnings: ['Docker was not added as an existing skill — candidate has no stated Docker experience.'],
});

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

function createService(overrides?: {
  resume?: ResumeRecord | null;
  analysis?: typeof mockAnalysisRecord | null;
}) {
  const resumeRepo = {
    findByIdForUser: vi.fn().mockResolvedValue(
      overrides?.resume !== undefined ? overrides.resume : mockResume,
    ),
    updateProcessing: vi.fn().mockResolvedValue(mockResume),
  } as unknown as ResumeRepository;

  const jobAnalysisRepo = {
    findByIdForUser: vi.fn().mockResolvedValue(
      overrides?.analysis !== undefined ? overrides.analysis : mockAnalysisRecord,
    ),
  } as unknown as ResumeJobAnalysisRepository;

  const service = new ResumeOptimizationService(resumeRepo, jobAnalysisRepo);
  return { service, resumeRepo, jobAnalysisRepo };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ResumeOptimizationService', () => {
  it('runs optimization successfully with valid inputs', async () => {
    vi.spyOn(AiService.prototype, 'complete').mockResolvedValue({
      content: validAiResponse,
      provider: 'groq',
      model: 'llama-3.3-70b-versatile',
      latencyMs: 300,
    });

    const { service } = createService();
    const result = await service.optimizeResume(userId, resumeId, analysisId);

    expect(result.optimizedSections).toHaveLength(1);
    expect(result.optimizedSections[0].key).toBe('summary');
    expect(result.suggestions).toHaveLength(1);
    expect(result.keywordImprovements).toHaveLength(1);
    expect(result.warnings).toHaveLength(1);
  });

  it('throws 404 when resume is not found (unauthorized user)', async () => {
    const { service } = createService({ resume: null });

    await expect(
      service.optimizeResume('other-user-xyz', resumeId, analysisId),
    ).rejects.toThrow(AppError);

    await expect(
      service.optimizeResume('other-user-xyz', resumeId, analysisId),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 404 when job analysis is not found (unauthorized user)', async () => {
    const { service, jobAnalysisRepo } = createService();
    vi.mocked(jobAnalysisRepo.findByIdForUser).mockResolvedValue(null);

    await expect(
      service.optimizeResume(userId, resumeId, analysisId),
    ).rejects.toThrow(AppError);

    await expect(
      service.optimizeResume(userId, resumeId, analysisId),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 400 when resume is not in PROCESSED status', async () => {
    const { service } = createService({
      resume: { ...mockResume, processing_status: 'UPLOADED' },
    });

    await expect(
      service.optimizeResume(userId, resumeId, analysisId),
    ).rejects.toThrow('Resume must be fully processed before optimization');
  });

  it('throws 400 when analysisId belongs to a different resume', async () => {
    const { service, jobAnalysisRepo } = createService();
    vi.mocked(jobAnalysisRepo.findByIdForUser).mockResolvedValue({
      ...mockAnalysisRecord,
      resume_id: 'different-resume-id',
    });

    await expect(
      service.optimizeResume(userId, resumeId, analysisId),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('throws 400 when resume has no structured data', async () => {
    const { service } = createService({
      resume: { ...mockResume, structured_data: null },
    });

    await expect(
      service.optimizeResume(userId, resumeId, analysisId),
    ).rejects.toThrow('Structured resume data is unavailable');
  });

  it('throws 400 when analysis has no analysis_result', async () => {
    const { service, jobAnalysisRepo } = createService();
    vi.mocked(jobAnalysisRepo.findByIdForUser).mockResolvedValue({
      ...mockAnalysisRecord,
      analysis_result: null,
    });

    await expect(
      service.optimizeResume(userId, resumeId, analysisId),
    ).rejects.toThrow('Job analysis data is unavailable');
  });

  it('propagates AI provider failures through the service', async () => {
    vi.spyOn(AiService.prototype, 'complete').mockRejectedValue(
      new AppError('All AI providers are down', 503, 'AI_ALL_PROVIDERS_FAILED'),
    );

    const { service } = createService();

    await expect(
      service.optimizeResume(userId, resumeId, analysisId),
    ).rejects.toThrow('All AI providers are down');
  });

  it('throws validation error for invalid analysisId UUID', async () => {
    const { service } = createService();

    await expect(
      service.optimizeResume(userId, resumeId, 'not-a-uuid'),
    ).rejects.toThrow();
  });
});
