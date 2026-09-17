import {
  MAX_RESUME_SCORE,
  MIN_RESUME_SCORE,
  SECTION_SCORE_WEIGHTS,
} from './resume.constants.js';
import { countSectionItems } from './resume.section-parser.js';
import type {
  ResumeAnalysis,
  ResumeSectionKey,
  SectionAnalysis,
  StructuredResumeData,
} from './resume.types.js';

type WeightedSectionKey = keyof typeof SECTION_SCORE_WEIGHTS;

function clampScore(value: number): number {
  if (!Number.isFinite(value)) {
    return MIN_RESUME_SCORE;
  }
  return Math.max(MIN_RESUME_SCORE, Math.min(MAX_RESUME_SCORE, Math.round(value)));
}

function scoreSummarySection(content: string, maxScore: number): number {
  const length = content.trim().length;
  if (length === 0) return 0;
  if (length >= 120) return maxScore;
  if (length >= 50) return Math.round(maxScore * 0.7);
  return Math.round(maxScore * 0.4);
}

function scoreSkillsSection(skillCount: number, maxScore: number): number {
  if (skillCount === 0) return 0;
  if (skillCount >= 8) return maxScore;
  if (skillCount >= 5) return Math.round(maxScore * 0.85);
  if (skillCount >= 3) return Math.round(maxScore * 0.6);
  return Math.round(maxScore * 0.35);
}

function scoreListSection(itemCount: number, maxScore: number): number {
  if (itemCount === 0) return 0;
  if (itemCount >= 3) return maxScore;
  if (itemCount >= 2) return Math.round(maxScore * 0.75);
  return Math.round(maxScore * 0.5);
}

function buildSectionFeedback(key: WeightedSectionKey, present: boolean, itemCount: number): string {
  if (!present) {
    return `Add a ${key} section to strengthen your resume.`;
  }

  if (key === 'summary' && itemCount === 0) {
    return 'Expand your summary with a concise overview of your background.';
  }

  if (key === 'skills' && itemCount < 5) {
    return 'Include more relevant skills to improve keyword coverage.';
  }

  if (itemCount < 2 && key !== 'summary' && key !== 'skills') {
    return `Add more detail under ${key}.`;
  }

  return `${key.charAt(0).toUpperCase()}${key.slice(1)} section looks solid.`;
}

/**
 * Deterministic resume analysis and scoring engine.
 * Score is the sum of weighted section scores (0-100).
 */
export function analyzeResume(data: StructuredResumeData): ResumeAnalysis {
  const sectionAnalyses: SectionAnalysis[] = [];
  let totalScore = 0;

  for (const key of Object.keys(SECTION_SCORE_WEIGHTS) as WeightedSectionKey[]) {
    const maxScore = SECTION_SCORE_WEIGHTS[key];
    const section = data.sections.find((item) => item.key === key);
    const present = Boolean(section?.content.trim());
    const itemCount = section ? countSectionItems(section) : 0;

    let score = 0;
    if (section) {
      if (key === 'summary') {
        score = scoreSummarySection(section.content, maxScore);
      } else if (key === 'skills') {
        score = scoreSkillsSection(data.skills.length, maxScore);
      } else {
        score = scoreListSection(itemCount, maxScore);
      }
    }

    totalScore += score;
    sectionAnalyses.push({
      key: key as ResumeSectionKey,
      present,
      itemCount: key === 'skills' ? data.skills.length : itemCount,
      score,
      maxScore,
      feedback: buildSectionFeedback(key, present, key === 'skills' ? data.skills.length : itemCount),
    });
  }

  const normalizedSkills = data.skills.map((skill) => skill.trim().toLowerCase()).filter(Boolean);
  const uniqueSkills = new Set(normalizedSkills);
  const duplicateSkillCount = normalizedSkills.length - uniqueSkills.size;

  const suggestions = sectionAnalyses
    .filter((section) => section.score < section.maxScore)
    .map((section) => section.feedback);

  if (data.skills.length === 0) {
    suggestions.push('Add a dedicated skills section with tools and technologies you know.');
  }

  if (duplicateSkillCount > 0) {
    suggestions.push('Remove duplicate skills to keep the resume concise.');
  }

  return {
    completenessScore: clampScore(totalScore),
    sectionAnalyses,
    skillCount: uniqueSkills.size,
    duplicateSkillCount,
    suggestions: Array.from(new Set(suggestions)),
  };
}

export function getResumeScore(analysis: ResumeAnalysis): number {
  return clampScore(analysis.completenessScore);
}
