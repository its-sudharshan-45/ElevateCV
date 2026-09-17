import type { DetailedResumeAnalysis, StructuredResume } from './resume-types.js';

const ROLE_REQUIRED_SKILLS: Record<string, string[]> = {
  'software engineer': ['Git', 'Data Structures', 'Algorithms', 'SQL', 'REST API', 'Unit Testing'],
  'full stack developer': ['JavaScript', 'React.js', 'Node.js', 'Express.js', 'HTML/CSS', 'Database', 'Git'],
  'frontend engineer': ['JavaScript', 'TypeScript', 'React.js', 'HTML/CSS', 'Web Performance', 'Git'],
  'backend engineer': ['Node.js', 'Python', 'Java', 'SQL', 'PostgreSQL', 'REST API', 'Docker', 'Git'],
  'data engineer': ['Python', 'SQL', 'ETL', 'Spark', 'Data Modeling', 'Docker', 'AWS'],
  'devops engineer': ['Docker', 'Kubernetes', 'CI/CD', 'AWS', 'Linux', 'Terraform', 'Git'],
};

/**
 * Evaluates a StructuredResume to generate actionable career insights, ATS scoring, skill gaps,
 * and role-matching recommendations.
 *
 * NOTE: ATS score and overall score are calculated by UpSkilr's proprietary scoring logic,
 * NOT Hugging Face NER confidence scores.
 */
export function analyzeStructuredResume(
  resume: StructuredResume,
  targetRole = 'Software Engineer',
): DetailedResumeAnalysis {
  const detectedSkills = resume.skills || [];

  // 1. Skill analysis
  const normalizedTarget = targetRole.toLowerCase().trim();
  const expectedSkills =
    ROLE_REQUIRED_SKILLS[normalizedTarget] || ROLE_REQUIRED_SKILLS['software engineer'];

  const missingSkills = expectedSkills.filter(
    (exp) => !detectedSkills.some((det) => det.toLowerCase().includes(exp.toLowerCase())),
  );

  const strengths: string[] = [];
  if (detectedSkills.length >= 8) {
    strengths.push('Broad technical skill set');
  }
  if (resume.projects.length >= 2) {
    strengths.push('Multiple practical projects');
  }
  if (resume.experience.length >= 1) {
    strengths.push('Relevant practical experience');
  }

  // 2. Experience analysis
  const expYears = resume.experience.length * 1; // estimate
  const expSummary =
    resume.experience.length > 0
      ? `Demonstrates ${resume.experience.length} recorded position(s) / role(s).`
      : 'Early career / fresher candidate with project-focused background.';

  // 3. Education analysis
  const eduSummary =
    resume.education.length > 0
      ? `Education recorded: ${resume.education.map((e) => [e.degree, e.institution].filter(Boolean).join(' at ')).join('; ')}`
      : 'No formal education details detected.';

  // 4. Projects analysis
  const projectStrengths: string[] = [];
  if (resume.projects.length > 0) {
    projectStrengths.push(`${resume.projects.length} project(s) detailed`);
  }
  if (resume.projects.some((p) => p.technologies && p.technologies.length > 0)) {
    projectStrengths.push('Projects include technology stack tags');
  }

  // 5. Calculate ATS Score (0 - 100)
  let atsScore = 40; // baseline

  if (resume.personal.name) atsScore += 5;
  if (resume.personal.email) atsScore += 5;
  if (resume.personal.phone) atsScore += 5;

  if (detectedSkills.length >= 8) atsScore += 20;
  else if (detectedSkills.length >= 5) atsScore += 15;
  else if (detectedSkills.length >= 3) atsScore += 10;

  if (resume.experience.length >= 2) atsScore += 15;
  else if (resume.experience.length >= 1) atsScore += 10;

  if (resume.education.length >= 1) atsScore += 10;
  if (resume.projects.length >= 2) atsScore += 10;
  else if (resume.projects.length >= 1) atsScore += 5;

  atsScore = Math.min(100, atsScore);

  // 6. Calculate Overall Resume Score (0 - 100)
  let overallScore = atsScore;

  if (missingSkills.length === 0) overallScore += 5;
  if (resume.certifications.length > 0) overallScore += 5;

  overallScore = Math.min(100, Math.max(0, Math.round(overallScore)));

  // 7. Recommendations
  const recommendations: string[] = [];

  if (missingSkills.length > 0) {
    recommendations.push(`Add core target role keywords: ${missingSkills.join(', ')}.`);
  }
  if (!resume.summary) {
    recommendations.push('Include a 2-3 sentence professional summary at the top of your resume.');
  }
  if (resume.projects.length < 2) {
    recommendations.push('Add at least 2 full-stack or technical projects with GitHub links.');
  }
  if (!resume.personal.phone || !resume.personal.email) {
    recommendations.push('Ensure contact details (email and phone) are clearly listed.');
  }
  if (recommendations.length === 0) {
    recommendations.push('Resume formatting and content look well-optimized for ATS scanners.');
  }

  return {
    overallScore,
    atsScore,
    targetRole,
    skills: {
      detected: detectedSkills,
      strengths,
      missing: missingSkills,
    },
    experience: {
      years: expYears,
      summary: expSummary,
    },
    education: {
      summary: eduSummary,
    },
    projects: {
      count: resume.projects.length,
      strengths: projectStrengths,
    },
    recommendations,
  };
}
