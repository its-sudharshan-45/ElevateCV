// cspell:ignore structuredResume skillDetail keywordDetail responsibilityDetail
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { optimizeResume } from './resume-optimizer.js';
import type { StructuredResume } from '../resume/resume-types.js';
import type { JobMatchAnalysis } from '../job/job-types.js';
import { AiService } from '../ai.service.js';
import { AppError } from '../../utils/errors.js';
import type { IAiProvider } from '../ai.types.js';

// ---------------------------------------------------------------------------
// Minimal test fixtures
// ---------------------------------------------------------------------------

const mockStructuredResume: StructuredResume = {
  personal: { name: 'Jane Dev', email: 'jane@example.com' },
  summary: 'Experienced full-stack developer with React and Node.js expertise.',
  skills: ['React', 'Node.js', 'PostgreSQL'],
  experience: [
    {
      title: 'Software Engineer',
      company: 'Acme Corp',
      description: 'Built REST APIs and React dashboards.',
    },
  ],
  education: [{ degree: 'B.Tech', field: 'Computer Science', institution: 'State University' }],
  projects: [{ name: 'Portfolio App', technologies: ['React', 'Node.js'], description: 'Personal portfolio website.' }],
  certifications: [],
  languages: [],
};

const mockAnalysis: JobMatchAnalysis = {
  matchScore: 65,
  category: 'Good Match',
  overview: 'Candidate has strong frontend skills but lacks some backend requirements.',
  breakdown: { skills: 70, experience: 60, responsibilities: 55, keywords: 50, education: 80, projects: 65 },
  matchedSkills: ['React', 'Node.js'],
  missingRequiredSkills: ['Docker', 'AWS'],
  missingPreferredSkills: ['GraphQL'],
  skillDetail: {
    matchedRequired: ['React', 'Node.js'],
    missingRequired: ['Docker', 'AWS'],
    matchedPreferred: [],
    missingPreferred: ['GraphQL'],
    scorePercent: 70,
  },
  experienceDetail: {
    requiredYears: 3,
    detectedProfessionalYears: 2,
    detectedInternshipMonths: 0,
    detectedProjectCount: 1,
    matchLevel: 'partial',
    scorePercent: 60,
    note: 'Slightly below required years.',
  },
  educationDetail: { required: ["Bachelor's"], detected: ["B.Tech"], matchLevel: 'strong', scorePercent: 100 },
  responsibilityDetail: {
    matched: ['Developed REST APIs'],
    unmatched: ['Deployed containerized microservices'],
    scorePercent: 55,
  },
  keywordDetail: {
    found: ['React', 'Node.js'],
    missing: ['CI/CD', 'Kubernetes'],
    scorePercent: 50,
  },
  projectDetail: { relevantProjects: [], scorePercent: 65 },
  strengths: ['Strong React skills', 'PostgreSQL experience'],
  recommendations: [
    { priority: 'high', text: 'Gain Docker experience', impact: 'Increases ATS score by ~15%' },
  ],
};

const validOptimizationResult = {
  optimizedSections: [
    {
      key: 'summary',
      original: 'Experienced full-stack developer with React and Node.js expertise.',
      improved:
        'Experienced full-stack developer specializing in React, Node.js, and PostgreSQL, with a focus on scalable REST APIs and responsive dashboards.',
      reason: 'Aligned keywords with job description requirements.',
    },
  ],
  suggestions: [
    {
      priority: 'high',
      text: 'Consider obtaining Docker certification if you have relevant experience.',
      impact: 'Would address the top missing required skill.',
    },
  ],
  keywordImprovements: [
    {
      keyword: 'CI/CD',
      suggestion: 'Mention any CI/CD pipeline experience in your project or experience sections.',
    },
  ],
  warnings: ['Docker was not added as an existing skill — candidate has no stated Docker experience.'],
};

// ---------------------------------------------------------------------------
// Helper: create a mocked AiService that replaces the module singleton
// ---------------------------------------------------------------------------

function createMockProvider(responseContent: string): IAiProvider {
  return {
    name: 'groq',
    isConfigured: vi.fn().mockReturnValue(true),
    complete: vi.fn().mockResolvedValue({
      content: responseContent,
      provider: 'groq',
      model: 'llama-3.3-70b-versatile',
      latencyMs: 200,
    }),
    healthCheck: vi.fn().mockResolvedValue({ provider: 'groq', configured: true, available: true }),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('resume-optimizer', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns a valid OptimizationResult when AI returns correct JSON', async () => {
    const mockProvider = createMockProvider(JSON.stringify(validOptimizationResult));
    vi.spyOn(AiService.prototype, 'complete').mockResolvedValue({
      content: JSON.stringify(validOptimizationResult),
      provider: 'groq',
      model: 'llama-3.3-70b-versatile',
      latencyMs: 200,
    });

    const result = await optimizeResume(
      mockStructuredResume,
      mockAnalysis,
      'Experienced full-stack developer...',
      'Seeking a React and Node.js developer with Docker experience.',
    );

    expect(result.optimizedSections).toHaveLength(1);
    expect(result.optimizedSections[0].key).toBe('summary');
    expect(result.optimizedSections[0].original).toBeTruthy();
    expect(result.optimizedSections[0].improved).toBeTruthy();
    expect(result.optimizedSections[0].reason).toBeTruthy();
    expect(result.suggestions).toHaveLength(1);
    expect(result.suggestions[0].priority).toBe('high');
    expect(result.keywordImprovements).toHaveLength(1);
    expect(result.warnings).toHaveLength(1);

    // Anti-hallucination check: Docker must NOT appear as an existing skill
    const improvedSummary = result.optimizedSections[0].improved;
    expect(improvedSummary).not.toContain('Docker');
    expect(improvedSummary).not.toContain('AWS');

    void mockProvider; // used in creation only
  });

  it('throws when AI returns malformed (non-JSON) response', async () => {
    vi.spyOn(AiService.prototype, 'complete').mockResolvedValue({
      content: 'This is completely invalid non-JSON text',
      provider: 'groq',
      model: 'llama-3.3-70b-versatile',
      latencyMs: 100,
    });

    await expect(
      optimizeResume(
        mockStructuredResume,
        mockAnalysis,
        'raw text',
        'job description',
      ),
    ).rejects.toThrow();
  });

  it('throws when AI returns JSON that fails Zod schema validation', async () => {
    const badResult = { wrongKey: 'invalid structure' };
    vi.spyOn(AiService.prototype, 'complete').mockResolvedValue({
      content: JSON.stringify(badResult),
      provider: 'groq',
      model: 'llama-3.3-70b-versatile',
      latencyMs: 100,
    });

    await expect(
      optimizeResume(
        mockStructuredResume,
        mockAnalysis,
        'raw text',
        'job description',
      ),
    ).rejects.toThrow();
  });

  it('throws when AI returns empty response', async () => {
    vi.spyOn(AiService.prototype, 'complete').mockResolvedValue({
      content: '',
      provider: 'groq',
      model: 'llama-3.3-70b-versatile',
      latencyMs: 50,
    });

    await expect(
      optimizeResume(
        mockStructuredResume,
        mockAnalysis,
        'raw text',
        'job description',
      ),
    ).rejects.toThrow();
  });

  it('propagates AI provider failures (e.g., all providers down)', async () => {
    vi.spyOn(AiService.prototype, 'complete').mockRejectedValue(
      new AppError('All providers failed', 503, 'AI_ALL_PROVIDERS_FAILED'),
    );

    await expect(
      optimizeResume(
        mockStructuredResume,
        mockAnalysis,
        'raw text',
        'job description',
      ),
    ).rejects.toThrow('All providers failed');
  });

  it('handles empty sections gracefully (no summary, no projects)', async () => {
    const resumeWithoutSummary: StructuredResume = {
      ...mockStructuredResume,
      summary: undefined,
      projects: [],
    };

    const resultWithEmptySkillsSection = {
      optimizedSections: [],
      suggestions: [{ priority: 'medium', text: 'Add a professional summary.', impact: 'Improves ATS readability.' }],
      keywordImprovements: [],
      warnings: ['Summary section not found in resume — not generated.'],
    };

    vi.spyOn(AiService.prototype, 'complete').mockResolvedValue({
      content: JSON.stringify(resultWithEmptySkillsSection),
      provider: 'groq',
      model: 'llama-3.3-70b-versatile',
      latencyMs: 150,
    });

    const result = await optimizeResume(
      resumeWithoutSummary,
      mockAnalysis,
      'raw text',
      'job description',
    );

    expect(result.optimizedSections).toHaveLength(0);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain('Summary');
  });

  it('returns valid result when optimizedSections have valid keys only', async () => {
    const resultWithInvalidKey = {
      optimizedSections: [
        { key: 'invalid_key', original: 'orig', improved: 'impv', reason: 'reason' },
      ],
      suggestions: [],
      keywordImprovements: [],
      warnings: [],
    };

    vi.spyOn(AiService.prototype, 'complete').mockResolvedValue({
      content: JSON.stringify(resultWithInvalidKey),
      provider: 'groq',
      model: 'llama-3.3-70b-versatile',
      latencyMs: 100,
    });

    // Zod schema only allows 'summary' | 'experience' | 'projects' | 'skills'
    await expect(
      optimizeResume(mockStructuredResume, mockAnalysis, 'raw text', 'job description'),
    ).rejects.toThrow();
  });
});
