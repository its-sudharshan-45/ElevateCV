/**
 * Skill Normalization for Job-Specific ATS Matching
 *
 * Normalizes skill names before comparison so that "ReactJS", "React.js",
 * and "React" all resolve to the same canonical form.
 */

// cspell:ignore reactjs vuejs sveltejs nextjs nuxtjs nestjs fastapi

/** Alias map: normalized (lowercase) alias -> canonical normalized form */
const SKILL_ALIASES: Record<string, string> = {
  // JavaScript
  'javascript': 'javascript',
  'js': 'javascript',
  'ecmascript': 'javascript',
  'es6': 'javascript',
  'es2015': 'javascript',
  // TypeScript
  'typescript': 'typescript',
  'ts': 'typescript',
  // React
  'react': 'react',
  'reactjs': 'react',
  'react.js': 'react',
  'react js': 'react',
  // Vue
  'vue': 'vue',
  'vuejs': 'vue',
  'vue.js': 'vue',
  'vue js': 'vue',
  // Svelte
  'svelte': 'svelte',
  'sveltejs': 'svelte',
  // Angular
  'angular': 'angular',
  'angularjs': 'angular',
  // Next.js
  'next': 'next.js',
  'nextjs': 'next.js',
  'next.js': 'next.js',
  'next js': 'next.js',
  // Nuxt
  'nuxt': 'nuxt',
  'nuxtjs': 'nuxt',
  // Node.js
  'node': 'node.js',
  'nodejs': 'node.js',
  'node.js': 'node.js',
  'node js': 'node.js',
  // Express
  'express': 'express',
  'expressjs': 'express',
  'express.js': 'express',
  'express js': 'express',
  // NestJS
  'nest': 'nestjs',
  'nestjs': 'nestjs',
  'nest.js': 'nestjs',
  // Python
  'python': 'python',
  'py': 'python',
  // FastAPI
  'fastapi': 'fastapi',
  'fast api': 'fastapi',
  // Django
  'django': 'django',
  // Flask
  'flask': 'flask',
  // Java
  'java': 'java',
  // Spring
  'spring': 'spring',
  'spring boot': 'spring boot',
  'springboot': 'spring boot',
  // Go
  'go': 'go',
  'golang': 'go',
  // Rust
  'rust': 'rust',
  // PostgreSQL
  'postgresql': 'postgresql',
  'postgres': 'postgresql',
  'pg': 'postgresql',
  // MySQL
  'mysql': 'mysql',
  // MongoDB
  'mongodb': 'mongodb',
  'mongo': 'mongodb',
  // Redis
  'redis': 'redis',
  // SQLite
  'sqlite': 'sqlite',
  // GraphQL
  'graphql': 'graphql',
  // REST
  'rest': 'rest api',
  'rest api': 'rest api',
  'restful': 'rest api',
  'rest apis': 'rest api',
  'restful api': 'rest api',
  'restful apis': 'rest api',
  // Docker
  'docker': 'docker',
  // Kubernetes
  'kubernetes': 'kubernetes',
  'k8s': 'kubernetes',
  // AWS
  'aws': 'aws',
  'amazon web services': 'aws',
  // GCP
  'gcp': 'gcp',
  'google cloud': 'gcp',
  'google cloud platform': 'gcp',
  // Azure
  'azure': 'azure',
  'microsoft azure': 'azure',
  // Git
  'git': 'git',
  'github': 'github',
  'gitlab': 'gitlab',
  // CI/CD
  'cicd': 'ci/cd',
  'ci/cd': 'ci/cd',
  'ci cd': 'ci/cd',
  'continuous integration': 'ci/cd',
  // Linux
  'linux': 'linux',
  'unix': 'linux',
  // Terraform
  'terraform': 'terraform',
  // HTML
  'html': 'html',
  'html5': 'html',
  // CSS
  'css': 'css',
  'css3': 'css',
  // Tailwind
  'tailwind': 'tailwind css',
  'tailwindcss': 'tailwind css',
  'tailwind css': 'tailwind css',
  // SASS/SCSS
  'sass': 'sass',
  'scss': 'sass',
  // Supabase
  'supabase': 'supabase',
  // Firebase
  'firebase': 'firebase',
  // Testing
  'jest': 'jest',
  'vitest': 'vitest',
  'cypress': 'cypress',
  'playwright': 'playwright',
  'selenium': 'selenium',
  // Agile/Soft
  'agile': 'agile',
  'scrum': 'scrum',
};

/** Strip common suffixes and lowercase */
function stripAndLower(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\.js$/i, '')      // strip trailing .js
    .replace(/\.py$/i, '')      // strip .py
    .replace(/\.ts$/i, '')      // strip .ts
    .replace(/[^\w\s./+#-]/g, '') // remove special chars except common ones
    .trim();
}

/**
 * Normalize a skill string to its canonical lowercase form.
 * Falls back to the stripped lowercase value if no alias is found.
 */
export function normalizeSkill(skill: string): string {
  const stripped = stripAndLower(skill);
  return SKILL_ALIASES[stripped] ?? stripped;
}

/**
 * Compare two skills after normalization.
 */
export function skillsMatch(a: string, b: string): boolean {
  const na = normalizeSkill(a);
  const nb = normalizeSkill(b);
  return na === nb || na.includes(nb) || nb.includes(na);
}

/**
 * Given a list of resume skills and a list of JD skills,
 * return the matched and missing sets (using canonical display names from JD).
 */
export function findMatchingSkills(
  resumeSkills: string[],
  jdSkills: string[],
): { matched: string[]; missing: string[] } {
  const matched: string[] = [];
  const missing: string[] = [];

  for (const jdSkill of jdSkills) {
    const found = resumeSkills.some((rs) => skillsMatch(rs, jdSkill));
    if (found) {
      matched.push(jdSkill);
    } else {
      missing.push(jdSkill);
    }
  }

  return { matched, missing };
}

export { SKILL_ALIASES };
