import { describe, expect, it } from 'vitest';
import { step1Schema, step2Schema, step3Schema, profileSubmitSchema } from './schemas';

describe('step1Schema', () => {
  it('requires a non-empty full name', () => {
    const result = step1Schema.safeParse({ fullName: '' });
    expect(result.success).toBe(false);
  });

  it('accepts full name with optional education fields', () => {
    const result = step1Schema.safeParse({
      fullName: 'Jane Doe',
      college: 'MIT',
      degree: 'B.Tech',
      fieldOfStudy: 'Computer Science',
      graduationYear: 2025,
    });
    expect(result.success).toBe(true);
  });

  it('accepts full name with no education fields', () => {
    const result = step1Schema.safeParse({ fullName: 'Jane Doe' });
    expect(result.success).toBe(true);
  });

  it('rejects a graduation year out of range', () => {
    const result = step1Schema.safeParse({ fullName: 'Jane Doe', graduationYear: 1800 });
    expect(result.success).toBe(false);
  });
});

describe('step2Schema', () => {
  it('requires currentStatus and experienceLevel', () => {
    const result = step2Schema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('accepts a complete career step payload', () => {
    const result = step2Schema.safeParse({
      currentStatus: 'fresher',
      targetRole: 'Software Engineer',
      experienceLevel: 'early_career',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid currentStatus value', () => {
    const result = step2Schema.safeParse({
      currentStatus: 'unemployed',
      experienceLevel: 'student',
    });
    expect(result.success).toBe(false);
  });
});

describe('step3Schema', () => {
  it('accepts an empty skills array', () => {
    const result = step3Schema.safeParse({ skills: [] });
    expect(result.success).toBe(true);
  });

  it('accepts a list of valid skills', () => {
    const result = step3Schema.safeParse({ skills: ['JavaScript', 'TypeScript', 'React'] });
    expect(result.success).toBe(true);
  });
});

describe('profileSubmitSchema (merged)', () => {
  it('accepts a complete profile payload', () => {
    const result = profileSubmitSchema.safeParse({
      fullName: 'Jane Doe',
      college: 'MIT',
      degree: 'B.Tech',
      fieldOfStudy: 'CS',
      graduationYear: 2025,
      currentStatus: 'fresher',
      targetRole: 'Software Engineer',
      experienceLevel: 'early_career',
      skills: ['JavaScript'],
    });
    expect(result.success).toBe(true);
  });
});
