import { AppError } from '../../utils/errors.js';
import { resumeRepository } from '../resume/resume.repository.js';
import { resumeVersionRepository } from './resume-version.repository.js';
import type {
  CreateResumeVersionInput,
  ResumeSectionDiff,
  ResumeVersionComparisonResponse,
  ResumeVersionRecord,
  ResumeVersionResponse,
  ResumeVersionSource,
  SectionItemDiff,
  SkillDiff,
  SummaryDiff,
} from './resume-version.types.js';

export function toResponse(record: ResumeVersionRecord): ResumeVersionResponse {
  return {
    id: record.id,
    resumeId: record.resume_id,
    userId: record.user_id,
    versionNumber: record.version_number,
    title: record.title,
    changesSummary: record.changes_summary,
    structuredData: record.structured_data,
    score: record.score,
    source: (record.source as ResumeVersionSource) ?? (record.version_number === 1 ? 'ORIGINAL' : 'MANUAL_EDIT'),
    isCurrent: Boolean(record.is_current),
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

export function computeSkillDiff(skillsA: string[], skillsB: string[]): SkillDiff {
  const setA = new Set(skillsA.map((s) => s.trim().toLowerCase()));
  const setB = new Set(skillsB.map((s) => s.trim().toLowerCase()));

  const added = skillsB.filter((s) => !setA.has(s.trim().toLowerCase()));
  const removed = skillsA.filter((s) => !setB.has(s.trim().toLowerCase()));
  const unchanged = skillsA.filter((s) => setB.has(s.trim().toLowerCase()));

  return { added, removed, unchanged };
}

export function computeSummaryDiff(summaryA?: string, summaryB?: string): SummaryDiff {
  const cleanA = (summaryA ?? '').trim();
  const cleanB = (summaryB ?? '').trim();
  return {
    versionA: cleanA,
    versionB: cleanB,
    isModified: cleanA.toLowerCase() !== cleanB.toLowerCase(),
  };
}

export function computeItemsDiff(
  itemsA: Record<string, unknown>[],
  itemsB: Record<string, unknown>[],
  titleKey: string,
  compareKeys: string[],
): SectionItemDiff {
  const added: string[] = [];
  const removed: string[] = [];
  const modified: { name: string; details: string }[] = [];

  const mapA = new Map<string, Record<string, unknown>>();
  for (const item of itemsA) {
    const key = String(item[titleKey] ?? '').trim().toLowerCase();
    if (key) mapA.set(key, item);
  }

  const mapB = new Map<string, Record<string, unknown>>();
  for (const item of itemsB) {
    const key = String(item[titleKey] ?? '').trim().toLowerCase();
    if (key) mapB.set(key, item);
  }

  // Find added and modified
  for (const [key, itemB] of mapB.entries()) {
    const itemA = mapA.get(key);
    const displayName = String(itemB[titleKey] ?? 'Item');
    if (!itemA) {
      added.push(displayName);
    } else {
      // Check if any significant fields differ
      const diffFields: string[] = [];
      for (const field of compareKeys) {
        const valA = JSON.stringify(itemA[field] ?? '');
        const valB = JSON.stringify(itemB[field] ?? '');
        if (valA !== valB) {
          diffFields.push(field);
        }
      }
      if (diffFields.length > 0) {
        modified.push({
          name: displayName,
          details: `Modified fields: ${diffFields.join(', ')}`,
        });
      }
    }
  }

  // Find removed
  for (const [key, itemA] of mapA.entries()) {
    if (!mapB.has(key)) {
      removed.push(String(itemA[titleKey] ?? 'Item'));
    }
  }

  return { added, removed, modified };
}

export function computeComprehensiveDiff(
  recordA: ResumeVersionRecord,
  recordB: ResumeVersionRecord,
): ResumeSectionDiff {
  const resumeA = recordA.structured_data?.structuredResume;
  const resumeB = recordB.structured_data?.structuredResume;

  // 1. Summary
  const summaryA = resumeA?.summary ?? recordA.structured_data?.sections?.find((s) => s.key === 'summary')?.content ?? '';
  const summaryB = resumeB?.summary ?? recordB.structured_data?.sections?.find((s) => s.key === 'summary')?.content ?? '';
  const summary = computeSummaryDiff(summaryA, summaryB);

  // 2. Skills
  const skillsA = resumeA?.skills ?? recordA.structured_data?.skills ?? [];
  const skillsB = resumeB?.skills ?? recordB.structured_data?.skills ?? [];
  const skills = computeSkillDiff(skillsA, skillsB);

  // 3. Experience
  const expA = (resumeA?.experience ?? []) as unknown as Record<string, unknown>[];
  const expB = (resumeB?.experience ?? []) as unknown as Record<string, unknown>[];
  const experience = computeItemsDiff(expA, expB, 'company', ['title', 'description', 'startDate', 'endDate']);

  // 4. Projects
  const projA = (resumeA?.projects ?? []) as unknown as Record<string, unknown>[];
  const projB = (resumeB?.projects ?? []) as unknown as Record<string, unknown>[];
  const projects = computeItemsDiff(projA, projB, 'name', ['description', 'technologies']);

  // 5. Education
  const eduA = (resumeA?.education ?? []) as unknown as Record<string, unknown>[];
  const eduB = (resumeB?.education ?? []) as unknown as Record<string, unknown>[];
  const education = computeItemsDiff(eduA, eduB, 'institution', ['degree', 'field', 'description']);

  // 6. Certifications
  const certA = (resumeA?.certifications ?? []) as unknown as Record<string, unknown>[];
  const certB = (resumeB?.certifications ?? []) as unknown as Record<string, unknown>[];
  const certifications = computeItemsDiff(certA, certB, 'name', ['issuer', 'date']);

  const changes: string[] = [];
  if (summary.isModified) changes.push('Professional Summary updated');
  if (skills.added.length > 0) changes.push(`${skills.added.length} skill(s) added`);
  if (skills.removed.length > 0) changes.push(`${skills.removed.length} skill(s) removed`);
  if (experience.added.length > 0) changes.push(`${experience.added.length} experience item(s) added`);
  if (experience.removed.length > 0) changes.push(`${experience.removed.length} experience item(s) removed`);
  if (experience.modified.length > 0) changes.push(`${experience.modified.length} experience item(s) updated`);
  if (projects.added.length > 0) changes.push(`${projects.added.length} project(s) added`);
  if (projects.modified.length > 0) changes.push(`${projects.modified.length} project(s) updated`);

  const overview = changes.length > 0 ? changes.join('; ') : 'No significant structural differences detected';

  return {
    summary,
    skills,
    experience,
    projects,
    education,
    certifications,
    overview,
  };
}

export class ResumeVersionService {
  /**
   * Explicitly create an immutable snapshot of a processed resume.
   * Only resumes with processing_status = 'PROCESSED' can be snapshotted.
   */
  async createVersion(input: CreateResumeVersionInput): Promise<ResumeVersionResponse> {
    const resume = await resumeRepository.findByIdForUser(input.resumeId, input.userId);
    if (!resume) {
      throw new AppError('Resume not found', 404, 'NOT_FOUND');
    }

    if (resume.processing_status !== 'PROCESSED') {
      throw new AppError(
        'Only processed resumes can be versioned. Wait for processing to complete.',
        409,
        'CONFLICT',
      );
    }

    const nextVersionNumber = await resumeVersionRepository.getNextVersionNumber(input.resumeId);

    const source: ResumeVersionSource = input.source ?? (nextVersionNumber === 1 ? 'ORIGINAL' : 'MANUAL_EDIT');
    const structuredData = input.structuredData ?? resume.structured_data;
    const score = input.score !== undefined ? input.score : resume.score;

    const record = await resumeVersionRepository.create({
      resumeId: input.resumeId,
      userId: input.userId,
      versionNumber: nextVersionNumber,
      title: input.title,
      changesSummary: input.changesSummary ?? '',
      structuredData,
      score,
      source,
      isCurrent: true,
    });

    return toResponse(record);
  }

  async listVersions(resumeId: string, userId: string): Promise<ResumeVersionResponse[]> {
    // Verify the resume belongs to the user before listing its versions.
    const resume = await resumeRepository.findByIdForUser(resumeId, userId);
    if (!resume) {
      throw new AppError('Resume not found', 404, 'NOT_FOUND');
    }

    let records = await resumeVersionRepository.listForResume(resumeId, userId);

    // Auto-initialize Version 1 (Original) if no versions exist yet for a processed resume
    if (records.length === 0 && resume.processing_status === 'PROCESSED') {
      const v1 = await resumeVersionRepository.create({
        resumeId,
        userId,
        versionNumber: 1,
        title: 'Original Upload',
        changesSummary: 'Initial snapshot of processed resume upload',
        structuredData: resume.structured_data,
        score: resume.score,
        source: 'ORIGINAL',
        isCurrent: true,
      });
      records = [v1];
    }

    // Ensure only one version has isCurrent = true (default to the highest version number if none set)
    const hasCurrent = records.some((r) => r.is_current);
    if (!hasCurrent && records.length > 0) {
      records[0].is_current = true;
    }

    return records.map(toResponse);
  }

  async getVersion(versionId: string, userId: string): Promise<ResumeVersionResponse> {
    const record = await resumeVersionRepository.findByIdForUser(versionId, userId);
    if (!record) {
      throw new AppError('Resume version not found', 404, 'NOT_FOUND');
    }

    return toResponse(record);
  }

  /**
   * Restore a historical version.
   * Restoring MUST create a brand-new version with source 'RESTORED'.
   * Never overwrites or deletes the historical version.
   */
  async restoreVersion(
    resumeId: string,
    versionId: string,
    userId: string,
  ): Promise<ResumeVersionResponse> {
    const resume = await resumeRepository.findByIdForUser(resumeId, userId);
    if (!resume) {
      throw new AppError('Resume not found', 404, 'NOT_FOUND');
    }

    const targetVersion = await resumeVersionRepository.findByIdForUser(versionId, userId);
    if (!targetVersion || targetVersion.resume_id !== resumeId) {
      throw new AppError('Target version not found for this resume', 404, 'NOT_FOUND');
    }

    const nextVersionNumber = await resumeVersionRepository.getNextVersionNumber(resumeId);

    const newVersion = await resumeVersionRepository.create({
      resumeId,
      userId,
      versionNumber: nextVersionNumber,
      title: `Restored from v${targetVersion.version_number}`,
      changesSummary: `Restored snapshot from version ${targetVersion.version_number} (${targetVersion.title})`,
      structuredData: targetVersion.structured_data,
      score: targetVersion.score,
      source: 'RESTORED',
      isCurrent: true,
    });

    return toResponse(newVersion);
  }

  /**
   * Compare two version snapshots.
   * Computes score delta and full section diff.
   */
  async compareVersions(
    versionAId: string,
    versionBId: string,
    userId: string,
  ): Promise<ResumeVersionComparisonResponse> {
    const [recordA, recordB] = await Promise.all([
      resumeVersionRepository.findByIdForUser(versionAId, userId),
      resumeVersionRepository.findByIdForUser(versionBId, userId),
    ]);

    if (!recordA) {
      throw new AppError('Version A not found or does not belong to you', 404, 'NOT_FOUND');
    }
    if (!recordB) {
      throw new AppError('Version B not found or does not belong to you', 404, 'NOT_FOUND');
    }

    const skillsA = recordA.structured_data?.skills ?? recordA.structured_data?.structuredResume?.skills ?? [];
    const skillsB = recordB.structured_data?.skills ?? recordB.structured_data?.structuredResume?.skills ?? [];
    const skillDiff = computeSkillDiff(skillsA, skillsB);

    const scoreDelta =
      recordA.score !== null && recordB.score !== null ? recordB.score - recordA.score : null;

    const sectionDiff = computeComprehensiveDiff(recordA, recordB);

    return {
      versionA: toResponse(recordA),
      versionB: toResponse(recordB),
      scoreDelta,
      skillDiff,
      sectionDiff,
    };
  }

  async deleteVersion(versionId: string, userId: string): Promise<void> {
    const deleted = await resumeVersionRepository.deleteByIdForUser(versionId, userId);
    if (!deleted) {
      throw new AppError('Resume version not found', 404, 'NOT_FOUND');
    }
  }
}

export const resumeVersionService = new ResumeVersionService();
