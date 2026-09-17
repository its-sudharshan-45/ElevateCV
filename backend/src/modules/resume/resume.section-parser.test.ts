import { describe, expect, it } from 'vitest';
import { parseResumeSections } from './resume.section-parser.js';

const SAMPLE_RESUME = `
JANE DOE
Software Engineer

SUMMARY
Motivated computer science student with internship experience building web applications.

SKILLS
JavaScript, TypeScript, React, Node.js, PostgreSQL

EXPERIENCE
Software Intern | Acme Corp | 2024
Built REST APIs and React dashboards.

EDUCATION
B.S. Computer Science | State University | 2026

PROJECTS
UpSkilr Career Platform
Built a full-stack career preparation platform.

CERTIFICATIONS
AWS Cloud Practitioner
`.trim();

describe('parseResumeSections', () => {
  it('detects common resume sections in varied order', () => {
    const structured = parseResumeSections(SAMPLE_RESUME);
    const keys = structured.sections.map((section) => section.key);

    expect(keys).toContain('summary');
    expect(keys).toContain('skills');
    expect(keys).toContain('experience');
    expect(keys).toContain('education');
    expect(keys).toContain('projects');
    expect(keys).toContain('certifications');
    expect(structured.skills.length).toBeGreaterThan(3);
  });

  it('tolerates missing sections without fabricating content', () => {
    const structured = parseResumeSections('SUMMARY\nShort intro only.');
    expect(structured.sections.some((section) => section.key === 'summary')).toBe(true);
    expect(structured.sections.some((section) => section.key === 'experience')).toBe(false);
    expect(structured.skills).toEqual([]);
  });

  it('handles empty documents', () => {
    const structured = parseResumeSections('');
    expect(structured.sections).toEqual([]);
    expect(structured.skills).toEqual([]);
  });
});
