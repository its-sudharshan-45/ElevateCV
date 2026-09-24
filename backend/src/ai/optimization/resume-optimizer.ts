// cspell:ignore structuredResume skillDetail keywordDetail responsibilityDetail
import { randomUUID } from 'node:crypto';
import { logger } from '../../config/logger.js';
import type { JobMatchAnalysis } from '../job/job-types.js';
import type { StructuredResume } from '../resume/resume-types.js';
import { StructuredOutputParser } from '../inference/structured-output-parser.js';
import { PromptSanitizer } from '../inference/prompt-sanitizer.js';
import { aiService } from '../ai.service.js';
import { AppError } from '../../utils/errors.js';
import {
  optimizationResultSchema,
  type OptimizationResult,
  type OptimizableSectionKey,
} from './optimization-types.js';

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
// Section Label Mapping
// ---------------------------------------------------------------------------

export function getSectionDisplayName(key: OptimizableSectionKey): string {
  switch (key) {
    case 'summary':
      return 'Professional Summary';
    case 'skills':
      return 'Skills';
    case 'experience':
      return 'Work Experience';
    case 'projects':
      return 'Projects';
    case 'education':
      return 'Education';
    case 'certifications':
      return 'Certifications';
    case 'achievements':
      return 'Achievements';
    case 'personal':
      return 'Personal Information';
    default:
      return key;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function getOriginalSectionText(structuredResume: StructuredResume, key: string): string {
  switch (key) {
    case 'summary':
      return structuredResume.summary ?? '';
    case 'skills':
      return (structuredResume.skills ?? []).join(', ');
    case 'experience':
      return (structuredResume.experience ?? [])
        .map((e) => {
          const dates = [e.startDate, e.endDate].filter(Boolean).join(' - ');
          const dateStr = dates ? ` (${dates})` : '';
          return `${e.title ?? ''} at ${e.company ?? ''}${dateStr}:\n${e.description ?? ''}`.trim();
        })
        .join('\n\n');
    case 'projects':
      return (structuredResume.projects ?? [])
        .map((p) => {
          const tech = (p.technologies ?? []).length > 0 ? ` [${(p.technologies ?? []).join(', ')}]` : '';
          return `${p.name ?? ''}${tech}:\n${p.description ?? ''}`.trim();
        })
        .join('\n\n');
    case 'education':
      return (structuredResume.education ?? [])
        .map((ed) => {
          const parts = [ed.degree, ed.field, ed.institution].filter(Boolean).join(', ');
          const dates = [ed.startDate, ed.endDate].filter(Boolean).join(' - ');
          return `${parts}${dates ? ` (${dates})` : ''}${ed.description ? `\n${ed.description}` : ''}`.trim();
        })
        .join('\n\n');
    case 'certifications':
      return (structuredResume.certifications ?? [])
        .map((c) => `${c.name ?? ''}${c.issuer ? ` by ${c.issuer}` : ''}${c.date ? ` (${c.date})` : ''}`.trim())
        .join('\n');
    case 'achievements':
      return (structuredResume.achievements ?? []).join('\n');
    case 'personal':
      return [
        structuredResume.personal.name,
        structuredResume.personal.email,
        structuredResume.personal.phone,
        structuredResume.personal.location,
      ]
        .filter(Boolean)
        .join(' | ');
    default:
      return '';
  }
}

// ---------------------------------------------------------------------------
// Prompt construction
// ---------------------------------------------------------------------------

function buildSystemPrompt(): string {
  return `You are an expert resume optimization assistant integrated into ElevateCV.

Your sole purpose is to improve the clarity, relevance, and ATS alignment of an existing resume against a specific target Job Description.

## STRICT RULES — NEVER VIOLATE UNDER ANY CIRCUMSTANCE:

1. GROUNDING & ANTI-HALLUCINATION:
   - Use ONLY facts, experiences, employers, degrees, tools, metrics, and achievements actually present in the resume.
   - You MUST NOT invent, assume, or extrapolate:
     * Company names or employers
     * Job titles or positions
     * Degrees, universities, or certifications
     * Technologies, programming languages, or tools not already mentioned
     * Projects or clients not already mentioned
     * Years or duration of experience
     * Quantified performance metrics (e.g., do NOT invent "increased revenue by 35%" or "reduced latency by 40%" unless the original text explicitly provided those numbers)
     * Awards or honors not already in the resume

2. HANDLING MISSING SKILLS & REQUIREMENTS:
   - You MUST NOT silently add missing skills or tools required by the job description to the resume.
   - If the job description requires a skill missing from the resume:
     * Put it in "keywordImprovements" or "suggestions" as a recommendation for the user to consider IF they have relevant experience.
     * Never present a missing skill as an existing skill in "optimizedSections".

3. ACCURACY & FACTUAL INTEGRITY:
   - Your suggestions must be limited to:
     * More concise, impactful phrasing and structure
     * Strong active verbs (e.g., "Architected", "Engineered", "Optimized", "Spearheaded")
     * Weaving in ATS keywords ONLY where factual context in the candidate's existing background genuinely supports it
     * Improving alignment with the job description using existing resume facts
   - If a section already has strong phrasing and cannot be improved without fabricating details, do not force an edit.

4. STRUCTURED DATA OUTPUT:
   - Return ONLY a single valid JSON object strictly adhering to the schema.
   - No introductory text, no markdown wrappers, no commentary outside the JSON.`;
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
  const experienceText = getOriginalSectionText(structuredResume, 'experience');
  const projectsText = getOriginalSectionText(structuredResume, 'projects');
  const educationText = getOriginalSectionText(structuredResume, 'education');
  const certificationsText = getOriginalSectionText(structuredResume, 'certifications');
  const achievementsText = getOriginalSectionText(structuredResume, 'achievements');

  return `Below is the candidate's current resume, the target job description, and the existing ATS match analysis.

${PromptSanitizer.wrapWithContext('resume_raw_text', sanitizedRaw)}

${PromptSanitizer.wrapWithContext('job_description', sanitizedJD)}

<ats_analysis>
ATS Match Score: ${analysis.matchScore}/100 (${analysis.category})
Missing Required Skills from JD: ${missingSkills.join(', ') || 'None'}
Missing Keywords from JD: ${missingKeywords.join(', ') || 'None'}
Unmatched Responsibilities from JD: ${unmatchedResponsibilities.join('; ') || 'None'}
ATS System Recommendations:
${recommendations || 'None'}
</ats_analysis>

<structured_resume>
Summary: ${summaryText || '(not present)'}
Skills: ${skillsText || '(not present)'}
Experience:
${experienceText || '(not present)'}
Projects:
${projectsText || '(not present)'}
Education:
${educationText || '(not present)'}
Certifications:
${certificationsText || '(not present)'}
Achievements:
${achievementsText || '(not present)'}
</structured_resume>

Based on the above, generate optimization suggestions. Return ONLY a valid JSON object matching this schema:
{
  "optimizedSections": [
    {
      "key": "summary",
      "original": "<original text from resume>",
      "improved": "<improved text for this section — rewrite for ATS impact using ONLY existing factual experience>",
      "reason": "<clear explanation of why this improvement aligns better with the target job description>"
    }
  ],
  "suggestions": [
    {
      "priority": "high",
      "text": "<actionable recommendation for the user>",
      "impact": "<expected ATS/hiring impact>"
    }
  ],
  "keywordImprovements": [
    {
      "keyword": "<missing keyword from JD>",
      "suggestion": "<natural way candidate can incorporate it IF candidate genuinely has relevant experience>"
    }
  ],
  "warnings": [
    "<anti-hallucination notices: explicitly note skills/facts from JD that were omitted because candidate has no stated experience>"
  ]
}

Instructions:
1. "optimizedSections" keys can only be one of: "summary", "experience", "projects", "skills", "education", "certifications", "achievements". Only optimize sections that actually exist in the resume.
2. The improved text must strictly preserve factual information. Never invent employers, titles, tools, or metrics.
3. Return ONLY valid JSON.`;
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

  let result;
  try {
    result = await aiService.complete({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      maxTokens: MAX_TOKENS,
      responseFormat: 'json',
      timeoutMs: 60_000,
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    const message = error instanceof Error ? error.message : 'AI optimization service request failed';
    logger.error({ err: error }, 'AI service complete call failed during resume optimization');
    throw new AppError(message, 502, 'AI_PROVIDER_ERROR');
  }

  logger.info(
    { provider: result.provider, model: result.model, latencyMs: result.latencyMs },
    'AI optimization completion received',
  );

  let optimizationResult: OptimizationResult;
  try {
    optimizationResult = StructuredOutputParser.parseAndValidate<OptimizationResult>(
      result.content,
      optimizationResultSchema,
      'resume-optimizer',
    );
  } catch (parseError) {
    logger.error({ err: parseError, rawContent: result.content }, 'Failed to parse AI optimization response');
    if (parseError instanceof AppError) {
      throw parseError;
    }
    throw new AppError(
      'AI model returned an unparsable or invalid optimization response. Please try again.',
      502,
      'INVALID_MODEL_OUTPUT',
    );
  }

  // Populate id, section label, original content, suggested content, and initial status
  for (const section of optimizationResult.optimizedSections) {
    if (!section.id) {
      section.id = `sug-${randomUUID()}`;
    }
    if (!section.section) {
      section.section = getSectionDisplayName(section.key);
    }
    if (!section.original || section.original.trim().length === 0) {
      section.original = getOriginalSectionText(structuredResume, section.key);
    }
    if (!section.originalContent) {
      section.originalContent = section.original;
    }
    if (!section.suggestedContent) {
      section.suggestedContent = section.improved;
    }
    if (!section.status) {
      section.status = 'PENDING';
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
