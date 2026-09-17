import { describe, expect, it } from 'vitest';
import { analyzeStructuredResume } from './resume-analyzer.js';
import type { StructuredResume } from './resume-types.js';

describe('Resume Analyzer Engine', () => {
  const sampleResume: StructuredResume = {
    personal: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+91 9876543210',
    },
    summary: 'Full stack engineer with experience in Node and React.',
    skills: ['Java', 'React.js', 'Node.js', 'MongoDB', 'Git', 'SQL'],
    experience: [
      { title: 'Software Engineer', company: 'Google', description: 'Built backend services.' },
    ],
    education: [
      { degree: 'B.Tech', field: 'Computer Science', institution: 'ABC University' },
    ],
    projects: [
      { name: 'UpSkilr', description: 'Career platform built using React and Node.js' },
      { name: 'Portfolio', description: 'Personal website built with HTML/CSS' },
    ],
    certifications: [{ name: 'AWS Certified Developer' }],
    languages: ['English', 'Hindi'],
  };

  it('calculates independent ATS score and overall score', () => {
    const analysis = analyzeStructuredResume(sampleResume, 'Full Stack Developer');

    expect(analysis.atsScore).toBeGreaterThanOrEqual(0);
    expect(analysis.atsScore).toBeLessThanOrEqual(100);
    expect(analysis.overallScore).toBeGreaterThanOrEqual(0);
    expect(analysis.overallScore).toBeLessThanOrEqual(100);
    expect(typeof analysis.atsScore).toBe('number');
  });

  it('identifies detected skills, strengths, and missing target role skills', () => {
    const analysis = analyzeStructuredResume(sampleResume, 'Full Stack Developer');

    expect(analysis.skills.detected).toContain('React.js');
    expect(analysis.skills.detected).toContain('Node.js');
    expect(analysis.skills.missing).toContain('HTML/CSS');
    expect(analysis.skills.strengths.length).toBeGreaterThan(0);
  });

  it('generates actionable career recommendations', () => {
    const analysis = analyzeStructuredResume(sampleResume, 'Full Stack Developer');

    expect(analysis.recommendations).toBeDefined();
    expect(Array.isArray(analysis.recommendations)).toBe(true);
    expect(analysis.recommendations.length).toBeGreaterThan(0);
  });
});
