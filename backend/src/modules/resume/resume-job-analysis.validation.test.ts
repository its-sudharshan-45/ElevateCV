import { describe, expect, it } from 'vitest';
import { analyzeJobSchema } from './resume-job-analysis.types.js';

describe('analyzeJobSchema', () => {
  const validPayload = {
    resumeId: '123e4567-e89b-12d3-a456-426614174000',
    jobDescription: 'We are seeking a Senior Full Stack Engineer with strong React and Node.js skills.',
    jobTitle: 'Senior Full Stack Engineer',
  };

  it('validates a correct payload', () => {
    const parsed = analyzeJobSchema.parse(validPayload);
    expect(parsed.resumeId).toBe(validPayload.resumeId);
    expect(parsed.jobDescription).toBe(validPayload.jobDescription);
    expect(parsed.jobTitle).toBe(validPayload.jobTitle);
  });

  it('allows optional jobTitle', () => {
    const { jobTitle: _jobTitle, ...withoutTitle } = validPayload;
    const parsed = analyzeJobSchema.parse(withoutTitle);
    expect(parsed.jobTitle).toBeUndefined();
  });

  it('rejects invalid resumeId format', () => {
    expect(() =>
      analyzeJobSchema.parse({
        ...validPayload,
        resumeId: 'not-a-uuid',
      }),
    ).toThrow();
  });

  it('rejects too short jobDescription', () => {
    expect(() =>
      analyzeJobSchema.parse({
        ...validPayload,
        jobDescription: 'short',
      }),
    ).toThrow();
  });

  it('rejects too long jobDescription (>20000 chars)', () => {
    expect(() =>
      analyzeJobSchema.parse({
        ...validPayload,
        jobDescription: 'a'.repeat(20001),
      }),
    ).toThrow();
  });
});
