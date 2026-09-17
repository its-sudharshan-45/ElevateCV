import { describe, expect, it } from 'vitest';
import { analyzeResume, getResumeScore } from './resume.analysis.service.js';
import type { StructuredResumeData } from './resume.types.js';

const completeResume: StructuredResumeData = {
  sections: [
    { key: 'summary', title: 'Summary', content: 'A'.repeat(140) },
    {
      key: 'skills',
      title: 'Skills',
      content: 'JavaScript, TypeScript, React, Node.js, PostgreSQL, Docker',
    },
    {
      key: 'experience',
      title: 'Experience',
      content: 'Engineer | Company | 2024\nBuilt APIs.\n\nIntern | Startup | 2023',
    },
    { key: 'education', title: 'Education', content: 'B.S. Computer Science | University | 2026' },
    { key: 'projects', title: 'Projects', content: 'Project A\n\nProject B\n\nProject C' },
    { key: 'certifications', title: 'Certifications', content: 'AWS Practitioner' },
  ],
  skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker'],
};

describe('analyzeResume', () => {
  it('returns deterministic score and suggestions for complete resumes', () => {
    const first = analyzeResume(completeResume);
    const second = analyzeResume(completeResume);

    expect(first.completenessScore).toBe(second.completenessScore);
    expect(getResumeScore(first)).toBe(first.completenessScore);
    expect(first.completenessScore).toBeGreaterThan(70);
    expect(first.suggestions.length).toBeGreaterThan(0);
  });

  it('handles empty resumes with minimum score', () => {
    const analysis = analyzeResume({ sections: [], skills: [] });
    expect(analysis.completenessScore).toBe(0);
    expect(analysis.sectionAnalyses.every((section) => section.score === 0)).toBe(true);
  });

  it('deduplicates skills in analysis metadata', () => {
    const analysis = analyzeResume({
      sections: [{ key: 'skills', title: 'Skills', content: 'React, react, Node.js' }],
      skills: ['React', 'react', 'Node.js'],
    });

    expect(analysis.skillCount).toBe(2);
    expect(analysis.duplicateSkillCount).toBe(1);
  });

  it('keeps score within configured bounds', () => {
    const analysis = analyzeResume(completeResume);
    expect(analysis.completenessScore).toBeGreaterThanOrEqual(0);
    expect(analysis.completenessScore).toBeLessThanOrEqual(100);
  });
});
