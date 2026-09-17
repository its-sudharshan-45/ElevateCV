import { describe, expect, it } from 'vitest';
import { matchResumeToJob } from './resume-job-matcher.js';
import type { StructuredResume } from '../resume/resume-types.js';
import type { JobRequirements } from './job-types.js';

const SAMPLE_RESUME: StructuredResume = {
  personal: { name: 'Jane Dev', email: 'jane@example.com', phone: '9999999999' },
  summary: 'Full-stack developer with React, Node.js and PostgreSQL expertise.',
  skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'REST API', 'Git', 'HTML', 'CSS'],
  experience: [
    {
      title: 'Software Engineer',
      company: 'Acme Corp',
      startDate: '2022-01-01',
      endDate: 'Present',
      description: 'Built REST APIs with Node.js and Express. Developed React frontends. Used PostgreSQL.',
    },
  ],
  education: [
    {
      degree: 'B.Tech',
      field: 'Computer Science',
      institution: 'Example University',
      startDate: '2018-01-01',
      endDate: '2022-05-01',
    },
  ],
  projects: [
    {
      name: 'Portfolio App',
      description: 'Full-stack app with React, Node.js and PostgreSQL.',
      technologies: ['React', 'Node.js', 'PostgreSQL'],
    },
  ],
  certifications: [],
  languages: [],
};

const SAMPLE_JD: JobRequirements = {
  title: 'Full Stack Developer',
  requiredSkills: ['React', 'Node.js', 'PostgreSQL', 'REST API', 'Git'],
  preferredSkills: ['Docker', 'AWS'],
  experienceRequirements: ['2+ years of professional experience'],
  educationRequirements: ["Bachelor's degree in Computer Science or related field"],
  responsibilities: [
    'Build REST APIs using Node.js',
    'Develop React frontends',
    'Work with PostgreSQL databases',
  ],
  keywords: ['React', 'Node.js', 'PostgreSQL', 'REST API', 'Git', 'Docker'],
};

describe('matchResumeToJob', () => {
  it('returns a score between 0 and 100', () => {
    const result = matchResumeToJob(SAMPLE_RESUME, SAMPLE_JD);
    expect(result.matchScore).toBeGreaterThanOrEqual(0);
    expect(result.matchScore).toBeLessThanOrEqual(100);
  });

  it('returns a category string', () => {
    const result = matchResumeToJob(SAMPLE_RESUME, SAMPLE_JD);
    const validCategories = ['Excellent Match', 'Strong Match', 'Good Match', 'Moderate Match', 'Low Match'];
    expect(validCategories).toContain(result.category);
  });

  it('returns matched skills that exist in resume', () => {
    const result = matchResumeToJob(SAMPLE_RESUME, SAMPLE_JD);
    for (const skill of result.matchedSkills) {
      const inResume = SAMPLE_RESUME.skills.some((s) =>
        s.toLowerCase().includes(skill.toLowerCase()) || skill.toLowerCase().includes(s.toLowerCase()),
      );
      expect(inResume).toBe(true);
    }
  });

  it('does not claim missing skills are present (anti-hallucination)', () => {
    const jdWithMissing: JobRequirements = {
      ...SAMPLE_JD,
      requiredSkills: ['React', 'Kubernetes', 'Terraform', 'Rust'],
    };
    const result = matchResumeToJob(SAMPLE_RESUME, jdWithMissing);
    // Kubernetes, Terraform, Rust are NOT in resume skills → should be missing
    expect(result.missingRequiredSkills).toContain('Kubernetes');
    expect(result.missingRequiredSkills).toContain('Terraform');
    expect(result.missingRequiredSkills).toContain('Rust');
  });

  it('scores a perfect-match resume highly', () => {
    const result = matchResumeToJob(SAMPLE_RESUME, SAMPLE_JD);
    expect(result.matchScore).toBeGreaterThanOrEqual(65);
  });

  it('scores a zero-skills resume low', () => {
    const emptyResume: StructuredResume = {
      personal: {},
      skills: [],
      experience: [],
      education: [],
      projects: [],
      certifications: [],
      languages: [],
    };
    const result = matchResumeToJob(emptyResume, SAMPLE_JD);
    expect(result.matchScore).toBeLessThan(50);
  });

  it('returns skill detail with matched and missing arrays', () => {
    const result = matchResumeToJob(SAMPLE_RESUME, SAMPLE_JD);
    expect(Array.isArray(result.skillDetail.matchedRequired)).toBe(true);
    expect(Array.isArray(result.skillDetail.missingRequired)).toBe(true);
  });

  it('returns experience detail with required years', () => {
    const result = matchResumeToJob(SAMPLE_RESUME, SAMPLE_JD);
    expect(result.experienceDetail.requiredYears).toBe(2);
  });

  it('returns education match level', () => {
    const result = matchResumeToJob(SAMPLE_RESUME, SAMPLE_JD);
    expect(['strong', 'partial', 'none']).toContain(result.educationDetail.matchLevel);
  });

  it('returns project relevance array', () => {
    const result = matchResumeToJob(SAMPLE_RESUME, SAMPLE_JD);
    expect(Array.isArray(result.projectDetail.relevantProjects)).toBe(true);
    expect(result.projectDetail.relevantProjects.length).toBeGreaterThan(0);
  });

  it('returns keyword found and missing arrays', () => {
    const result = matchResumeToJob(SAMPLE_RESUME, SAMPLE_JD);
    expect(Array.isArray(result.keywordDetail.found)).toBe(true);
    expect(Array.isArray(result.keywordDetail.missing)).toBe(true);
  });

  it('returns at least one strength for a strong resume', () => {
    const result = matchResumeToJob(SAMPLE_RESUME, SAMPLE_JD);
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it('handles JD with no required skills gracefully', () => {
    const emptyJD: JobRequirements = {
      requiredSkills: [],
      preferredSkills: [],
      experienceRequirements: [],
      educationRequirements: [],
      responsibilities: [],
      keywords: [],
    };
    const result = matchResumeToJob(SAMPLE_RESUME, emptyJD);
    expect(result.matchScore).toBeGreaterThanOrEqual(0);
    expect(result.matchScore).toBeLessThanOrEqual(100);
  });

  it('score boundaries are always 0-100', () => {
    // Force a terrible resume against a demanding JD
    const tinyResume: StructuredResume = {
      personal: {},
      skills: ['MS Word'],
      experience: [],
      education: [],
      projects: [],
      certifications: [],
      languages: [],
    };
    const result = matchResumeToJob(tinyResume, SAMPLE_JD);
    expect(result.matchScore).toBeGreaterThanOrEqual(0);
    expect(result.matchScore).toBeLessThanOrEqual(100);
  });
});
