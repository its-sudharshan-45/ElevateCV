import { describe, expect, it } from 'vitest';
import { normalizeSkill, skillsMatch } from './skill-normalization.js';

describe('skill normalization', () => {
  it('normalizes aliases deterministically', () => {
    expect(normalizeSkill('JS')).toBe('javascript');
    expect(normalizeSkill('Node.js')).toBe('nodejs');
  });

  it('matches skills with case and alias differences', () => {
    expect(skillsMatch('JavaScript', 'javascript')).toBe(true);
    expect(skillsMatch('Node', 'Node.js')).toBe(true);
    expect(skillsMatch('Python', 'Java')).toBe(false);
  });
});
