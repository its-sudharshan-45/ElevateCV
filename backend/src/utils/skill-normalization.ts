/**
 * Conservative skill alias map for deterministic normalization.
 * Only explicit equivalences are mapped — no fuzzy semantic matching.
 */
export const SKILL_ALIASES: Record<string, string> = {
  js: 'javascript',
  'node.js': 'nodejs',
  node: 'nodejs',
  postgres: 'postgresql',
  'react.js': 'react',
  'vue.js': 'vue',
  'angular.js': 'angular',
  ts: 'typescript',
  py: 'python',
  'c#': 'csharp',
  'c++': 'cpp',
  aws: 'amazon web services',
  gcp: 'google cloud platform',
};

/**
 * Normalizes a skill string for comparison.
 * Lowercases, trims, removes surrounding punctuation, applies alias map.
 */
export function normalizeSkill(skill: string): string {
  const cleaned = skill
    .trim()
    .toLowerCase()
    .replace(/^[\s\-•*]+|[\s\-•*]+$/g, '');

  if (!cleaned) {
    return '';
  }

  return SKILL_ALIASES[cleaned] ?? cleaned;
}

/**
 * Deduplicates skills using normalized form while preserving first display label.
 */
export function dedupeSkills(skills: string[]): string[] {
  const seen = new Map<string, string>();

  for (const skill of skills) {
    const normalized = normalizeSkill(skill);
    if (normalized && !seen.has(normalized)) {
      seen.set(normalized, skill.trim());
    }
  }

  return Array.from(seen.values());
}

/**
 * Returns true when two skill strings match under conservative normalization.
 */
export function skillsMatch(resumeSkill: string, jobSkill: string): boolean {
  const a = normalizeSkill(resumeSkill);
  const b = normalizeSkill(jobSkill);

  if (!a || !b) {
    return false;
  }

  if (a === b) {
    return true;
  }

  // Allow substring match only for multi-word skills (e.g. "amazon web services" contains "aws" after alias)
  if (a.length >= 4 && b.length >= 4) {
    return a.includes(b) || b.includes(a);
  }

  return false;
}

export function findMatchingResumeSkill(
  jobSkill: string,
  resumeSkills: string[],
): string | null {
  for (const resumeSkill of resumeSkills) {
    if (skillsMatch(resumeSkill, jobSkill)) {
      return resumeSkill;
    }
  }
  return null;
}
