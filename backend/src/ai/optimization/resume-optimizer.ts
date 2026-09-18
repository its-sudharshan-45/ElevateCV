// cspell:ignore structuredResume skillDetail keywordDetail responsibilityDetail
import { logger } from '../../config/logger.js';
import type { JobMatchAnalysis } from '../job/job-types.js';
import type { StructuredResume } from '../resume/resume-types.js';
import { StructuredOutputParser } from '../inference/structured-output-parser.js';
import { PromptSanitizer } from '../inference/prompt-sanitizer.js';
import { aiService } from '../ai.service.js';
import { optimizationResultSchema, type OptimizationResult } from './optimization-types.js';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Maximum characters of raw resume text to send to the AI. */
const MAX_RESUME_TEXT_CHARS = 6_000;
/** Maximum characters of job description to send to the AI. */
const MAX_JD_CHARS = 3_000;
/** Maximum tokens for AI completion. */
const MAX_TOKENS = 8_000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getOriginalSectionText(structuredResume: StructuredResume, key: string): string {
  switch (key) {
    case 'summary':
      return structuredResume.summary ?? '';
    case 'skills':
      return (structuredResume.skills ?? []).join(', ');
    case 'experience':
      return (structuredResume.experience ?? [])
        .map((e) => `${e.title ?? ''} at ${e.company ?? ''}: ${e.description ?? ''}`)
        .join('\n\n');
    case 'projects':
      return (structuredResume.projects ?? [])
        .map((p) => `${p.name ?? ''} [${(p.technologies ?? []).join(', ')}]: ${p.description ?? ''}`)
        .join('\n\n');
    default:
      return '';
  }
}

// ---------------------------------------------------------------------------
// Prompt construction
// ---------------------------------------------------------------------------

function buildSystemPrompt(): string {
  return `You are an expert resume optimization assistant integrated into ElevateCV.

Your sole purpose is to improve the clarity, relevance, and ATS alignment of an existing resume.

## STRICT RULES — DO NOT VIOLATE

1. You MUST NOT invent or fabricate any of the following:
   - Company names
   - Job titles
   - Degrees or certifications
   - Technologies or tools not already in the resume
   - Projects not already in the resume
   - Years of experience
   - Performance metrics (e.g., do NOT add "by 42%" unless the original text already states it)
   - Awards or achievements not already mentioned

2. You MUST NOT silently add missing skills as if the candidate already has them.
   If the job description requires a skill absent from the resume, you may only SUGGEST the candidate
   add it if they genuinely have experience — never insert it as an existing skill.

3. You MUST preserve all factual information exactly as stated in the original resume.

4. Your improvements are limited to:
   - Clearer phrasing and structure
   - Better use of action verbs
   - Weaving in relevant keywords naturally (only if context from resume supports it)
   - Improving alignment with the job description using existing resume facts

5. If a section has no meaningful improvement, return the original text unchanged and explain why.

6. Return ONLY valid JSON matching the specified schema. No markdown, no explanations outside JSON.`;
}

function buildUserPrompt(
  structuredResume: StructuredResume,
  analysis: JobMatchAnalysis,
  rawResumeText: string,
  jobDescription: string,
): string {
  const sanitizedRaw = PromptSanitizer.sanitizeUserInput(rawResumeText, MAX_RESUME_TEXT_CHARS);
  const sanitizedJD = PromptSanitizer.sanitizeUserInput(jobDescription, MAX_JD_CHARS);

  const missingSkills = analysis.skillDetail?.missingRequired ?? [];
  const missingKeywords = analysis.keywordDetail?.missing ?? [];
  const unmatchedResponsibilities = analysis.responsibilityDetail?.unmatched ?? [];
  const recommendations = analysis.recommendations
    ?.map((r) => `[${r.priority.toUpperCase()}] ${r.text}`)
    .join('\n') ?? '';

  const summaryText = structuredResume.summary ?? '';
  const skillsText = (structuredResume.skills ?? []).join(', ');
  const experienceText = (structuredResume.experience ?? [])
    .map((e) => `${e.title ?? ''} at ${e.company ?? ''}: ${e.description ?? ''}`)
    .join('\n');
  const projectsText = (structuredResume.projects ?? [])
    .map((p) => `${p.name ?? ''} [${(p.technologies ?? []).join(', ')}]: ${p.description ?? ''}`)
    .join('\n');

  return `Below is everything you need to optimize this resume.

${PromptSanitizer.wrapWithContext('resume_raw_text', sanitizedRaw)}

${PromptSanitizer.wrapWithContext('job_description', sanitizedJD)}

<ats_analysis>
ATS Match Score: ${analysis.matchScore}/100 (${analysis.category})
Missing Required Skills: ${missingSkills.join(', ') || 'None'}
Missing Keywords: ${missingKeywords.join(', ') || 'None'}
Unmatched Responsibilities: ${unmatchedResponsibilities.join('; ') || 'None'}
ATS Recommendations:
${recommendations || 'None'}
</ats_analysis>

<structured_resume>
Summary: ${summaryText || '(not present)'}
Skills: ${skillsText || '(not present)'}
Experience:
${experienceText || '(not present)'}
Projects:
${projectsText || '(not present)'}
</structured_resume>

Based on the above, return ONLY a valid JSON object matching this schema:
{
  "optimizedSections": [
    {
      "key": "summary",
      "original": "<original text of this section>",
      "improved": "<improved text for this section — rewrite to improve impact and ATS alignment using ONLY existing factual experience>",
      "reason": "<brief explanation of changes>"
    }
  ],
  "suggestions": [
    {
      "priority": "high",
      "text": "<actionable suggestion>",
      "impact": "<expected ATS/hiring impact>"
    }
  ],
  "keywordImprovements": [
    {
      "keyword": "<missing keyword from JD>",
      "suggestion": "<natural way to incorporate it IF candidate genuinely has relevant experience>"
    }
  ],
  "warnings": [
    "<anti-hallucination warning or note>"
  ]
}

Instructions:
1. "optimizedSections" keys can only be one of: "summary", "experience", "projects", "skills". Only include sections that actually exist in the resume.
2. The improved text must strictly preserve factual information from the original resume. Do not invent employers, titles, tools, or metrics.
3. Return ONLY the raw JSON object. Do not include markdown formatting or comments.`;
}

// ---------------------------------------------------------------------------
// Main optimization function
// ---------------------------------------------------------------------------

export async function optimizeResume(
  structuredResume: StructuredResume,
  analysis: JobMatchAnalysis,
  rawResumeText: string,
  jobDescription: string,
): Promise<OptimizationResult> {
  logger.info(
    {
      matchScore: analysis.matchScore,
      missingSkillsCount: analysis.skillDetail?.missingRequired?.length ?? 0,
    },
    'Starting AI resume optimization',
  );

  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(structuredResume, analysis, rawResumeText, jobDescription);

  const result = await aiService.complete({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.3,
    maxTokens: MAX_TOKENS,
    responseFormat: 'json',
    timeoutMs: 60_000,
  });

  logger.info(
    { provider: result.provider, model: result.model, latencyMs: result.latencyMs },
    'AI optimization completion received',
  );

  const optimizationResult = StructuredOutputParser.parseAndValidate(
    result.content,
    optimizationResultSchema,
    'resume-optimizer',
  );

  // Ensure original section text is populated for side-by-side comparison
  for (const section of optimizationResult.optimizedSections) {
    if (!section.original || section.original.trim().length === 0) {
      section.original = getOriginalSectionText(structuredResume, section.key);
    }
  }

  logger.info(
    {
      sectionCount: optimizationResult.optimizedSections.length,
      suggestionCount: optimizationResult.suggestions.length,
      keywordCount: optimizationResult.keywordImprovements.length,
      warningCount: optimizationResult.warnings.length,
    },
    'AI resume optimization completed successfully',
  );

  return optimizationResult;
}
