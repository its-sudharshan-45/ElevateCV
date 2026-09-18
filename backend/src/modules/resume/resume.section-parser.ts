import {
  SECTION_HEADING_PATTERNS,
} from './resume.constants.js';
import type { ResumeSection, ResumeSectionKey, StructuredResumeData } from './resume.types.js';

const SECTION_ORDER: ResumeSectionKey[] = [
  'summary',
  'skills',
  'experience',
  'education',
  'projects',
  'certifications',
];

function cleanHeadingCandidate(line: string): string {
  return line
    .trim()
    .replace(/^[\s•\-*#_`~>|]+/, '')
    .replace(/[:\-#*_`~>|]+$/g, '')
    .trim();
}

function detectSectionKey(line: string): ResumeSectionKey | null {
  const normalized = cleanHeadingCandidate(line);
  if (!normalized || normalized.length > 80) {
    return null;
  }

  for (const key of SECTION_ORDER) {
    const patterns = SECTION_HEADING_PATTERNS[key];
    if (patterns?.some((pattern) => pattern.test(normalized))) {
      return key;
    }
  }

  return null;
}

function isLikelyHeading(line: string): boolean {
  const cleaned = cleanHeadingCandidate(line);
  if (!cleaned || cleaned.length > 80) {
    return false;
  }

  if (detectSectionKey(line)) {
    return true;
  }

  const alphaChars = cleaned.replace(/[^A-Za-z]/g, '');
  if (alphaChars.length >= 3 && cleaned === cleaned.toUpperCase() && !cleaned.includes('.')) {
    return true;
  }

  return false;
}

function splitIntoItems(content: string): string[] {
  return content
    .split(/\n{2,}|(?:\n(?=\s*[•\-*]\s))/g)
    .map((item) => item.replace(/^\s*[•\-*]\s*/, '').trim())
    .filter((item) => item.length > 0);
}

function extractSkillsFromSection(content: string): string[] {
  const lines = content
    .split('\n')
    .flatMap((line) => line.split(/[,;|]/))
    .map((part) => part.replace(/^\s*[•\-*]\s*/, '').trim())
    .filter(Boolean);

  const unique = new Map<string, string>();
  for (const skill of lines) {
    const normalized = skill.toLowerCase();
    if (!unique.has(normalized)) {
      unique.set(normalized, skill);
    }
  }

  return Array.from(unique.values());
}

/**
 * Parses extracted resume text into structured sections.
 * Missing sections are omitted rather than fabricated.
 */
export function parseResumeSections(text: string): StructuredResumeData {
  const lines = text.split('\n');
  const sections: ResumeSection[] = [];
  let currentKey: ResumeSectionKey | 'other' | null = null;
  let currentTitle = '';
  let currentLines: string[] = [];

  const flushSection = () => {
    if (!currentKey) {
      return;
    }

    const content = currentLines.join('\n').trim();
    if (content) {
      sections.push({
        key: currentKey,
        title: currentTitle,
        content,
      });
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (currentLines.length > 0 && currentLines[currentLines.length - 1] !== '') {
        currentLines.push('');
      }
      continue;
    }

    const sectionKey = isLikelyHeading(trimmed) ? detectSectionKey(trimmed) : null;
    if (sectionKey) {
      flushSection();
      currentKey = sectionKey;
      currentTitle = trimmed;
      currentLines = [];
      continue;
    }

    if (!currentKey) {
      currentKey = 'other';
      currentTitle = 'Other';
    }

    currentLines.push(trimmed);
  }

  flushSection();

  const skillsSection = sections.find((section) => section.key === 'skills');
  const skills = skillsSection ? extractSkillsFromSection(skillsSection.content) : [];

  return {
    sections,
    skills,
  };
}

export function countSectionItems(section: ResumeSection): number {
  if (section.key === 'skills') {
    return extractSkillsFromSection(section.content).length;
  }

  return splitIntoItems(section.content).length || (section.content.trim() ? 1 : 0);
}
