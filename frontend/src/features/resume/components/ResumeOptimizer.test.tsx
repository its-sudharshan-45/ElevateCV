import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ResumeOptimizer } from './ResumeOptimizer';
import * as resumeApi from '@/features/resume/api/resume.api';
import type { JobMatchAnalysis, OptimizeResumeResponse } from '@/features/resume/types/resume';

// ---------------------------------------------------------------------------
// Mock the API
// ---------------------------------------------------------------------------

vi.mock('@/features/resume/api/resume.api', () => ({
  optimizeResume: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockAnalysis: JobMatchAnalysis = {
  matchScore: 65,
  category: 'Good Match',
  overview: 'Candidate has strong frontend skills.',
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
    note: '',
  },
  educationDetail: { required: [], detected: [], matchLevel: 'strong', scorePercent: 100 },
  responsibilityDetail: { matched: [], unmatched: [], scorePercent: 55 },
  keywordDetail: { found: ['React'], missing: ['CI/CD', 'Kubernetes'], scorePercent: 50 },
  projectDetail: { relevantProjects: [], scorePercent: 65 },
  strengths: ['Strong React skills'],
  recommendations: [{ priority: 'high', text: 'Add Docker experience', impact: 'High ATS impact' }],
};

const successResponse: OptimizeResumeResponse = {
  success: true,
  data: {
    optimizedSections: [
      {
        key: 'summary',
        original: 'Experienced developer.',
        improved: 'Experienced full-stack developer with React and Node.js, building scalable REST APIs.',
        reason: 'Aligned with job description keywords.',
      },
    ],
    suggestions: [
      {
        priority: 'high',
        text: 'Consider gaining Docker experience if applicable.',
        impact: 'Addresses the top missing required skill.',
      },
    ],
    keywordImprovements: [
      {
        keyword: 'CI/CD',
        suggestion: 'Mention CI/CD pipeline experience in your projects section.',
      },
    ],
    warnings: ['Docker was not added — no stated experience in original resume.'],
  },
};

const defaultProps = {
  resumeId: '123e4567-e89b-12d3-a456-426614174000',
  analysisId: '223e4567-e89b-12d3-a456-426614174001',
  analysis: mockAnalysis,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ResumeOptimizer', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders the Optimize Resume button in idle state', () => {
    render(<ResumeOptimizer {...defaultProps} />);
    const btn = screen.getByRole('button', { name: /optimize resume/i });
    expect(btn).toBeDefined();
  });

  it('shows missing skills count in idle state', () => {
    render(<ResumeOptimizer {...defaultProps} />);
    expect(screen.getByText(/2 missing required skill/i)).toBeDefined();
  });

  it('shows current ATS score in idle state', () => {
    render(<ResumeOptimizer {...defaultProps} />);
    expect(screen.getByText('65/100')).toBeDefined();
  });

  it('shows loading state while API call is in progress', async () => {
    vi.mocked(resumeApi.optimizeResume).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(successResponse), 500)),
    );

    render(<ResumeOptimizer {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /optimize resume/i }));

    await waitFor(() => {
      expect(screen.getByRole('status')).toBeDefined();
      expect(screen.getByText(/AI is analyzing your resume/i)).toBeDefined();
    });
  });

  it('displays optimized sections after successful API call', async () => {
    vi.mocked(resumeApi.optimizeResume).mockResolvedValue(successResponse);

    render(<ResumeOptimizer {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /optimize resume/i }));

    await waitFor(() => {
      expect(screen.getByText('Professional Summary')).toBeDefined();
      expect(screen.getByText('Experienced developer.')).toBeDefined();
      expect(screen.getByText(/scalable REST APIs/i)).toBeDefined();
    });
  });

  it('shows anti-hallucination grounded notice on success', async () => {
    vi.mocked(resumeApi.optimizeResume).mockResolvedValue(successResponse);

    render(<ResumeOptimizer {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /optimize resume/i }));

    await waitFor(() => {
      expect(screen.getByText(/Grounded in your resume/i)).toBeDefined();
    });
  });

  it('displays suggestions tab with correct content', async () => {
    vi.mocked(resumeApi.optimizeResume).mockResolvedValue(successResponse);

    render(<ResumeOptimizer {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /optimize resume/i }));

    await waitFor(() => {
      expect(screen.getByText(/Suggestions \(1\)/i)).toBeDefined();
    });

    fireEvent.click(screen.getByText(/Suggestions \(1\)/i));
    await waitFor(() => {
      expect(screen.getByText(/Consider gaining Docker experience/i)).toBeDefined();
    });
  });

  it('displays keyword improvements on keywords tab', async () => {
    vi.mocked(resumeApi.optimizeResume).mockResolvedValue(successResponse);

    render(<ResumeOptimizer {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /optimize resume/i }));

    await waitFor(() => {
      expect(screen.getByText(/Keywords \(1\)/i)).toBeDefined();
    });

    fireEvent.click(screen.getByText(/Keywords \(1\)/i));
    await waitFor(() => {
      expect(screen.getByText('CI/CD')).toBeDefined();
      expect(screen.getByText(/Mention CI\/CD pipeline experience/i)).toBeDefined();
    });
  });

  it('shows error state when API call fails', async () => {
    vi.mocked(resumeApi.optimizeResume).mockRejectedValue(new Error('Network failure'));

    render(<ResumeOptimizer {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /optimize resume/i }));

    await waitFor(() => {
      expect(screen.getByText(/^Optimization failed$/i)).toBeDefined();
      expect(screen.getByText(/AI optimization failed/i)).toBeDefined();
    });
  });

  it('shows Optimize Resume button again after error (allows retry)', async () => {
    vi.mocked(resumeApi.optimizeResume).mockRejectedValue(new Error('Temporary failure'));

    render(<ResumeOptimizer {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /optimize resume/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /optimize resume/i })).toBeDefined();
    });
  });

  it('handles empty optimizedSections gracefully', async () => {
    const emptyResponse: OptimizeResumeResponse = {
      success: true,
      data: {
        optimizedSections: [],
        suggestions: [],
        keywordImprovements: [],
        warnings: [],
      },
    };

    vi.mocked(resumeApi.optimizeResume).mockResolvedValue(emptyResponse);

    render(<ResumeOptimizer {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /optimize resume/i }));

    await waitFor(() => {
      expect(screen.getByText(/No section improvements were generated/i)).toBeDefined();
    });
  });
});
