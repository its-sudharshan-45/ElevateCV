import { AppError } from '../../utils/errors.js';
import { resumeRepository } from '../resume/resume.repository.js';
import { resumeVersionRepository } from './resume-version.repository.js';
import type {
  CreateResumeVersionInput,
  ResumeVersionComparisonResponse,
  ResumeVersionRecord,
  ResumeVersionResponse,
  SkillDiff,
} from './resume-version.types.js';

function toResponse(record: ResumeVersionRecord): ResumeVersionResponse {
  return {
    id: record.id,
    resumeId: record.resume_id,
    userId: record.user_id,
    versionNumber: record.version_number,
    title: record.title,
    changesSummary: record.changes_summary,
    structuredData: record.structured_data,
    score: record.score,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

function computeSkillDiff(skillsA: string[], skillsB: string[]): SkillDiff {
  const setA = new Set(skillsA.map((s) => s.toLowerCase()));
  const setB = new Set(skillsB.map((s) => s.toLowerCase()));

  const added = skillsB.filter((s) => !setA.has(s.toLowerCase()));
  const removed = skillsA.filter((s) => !setB.has(s.toLowerCase()));
  const unchanged = skillsA.filter((s) => setB.has(s.toLowerCase()));

  return { added, removed, unchanged };
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

    const record = await resumeVersionRepository.create({
      resumeId: input.resumeId,
      userId: input.userId,
      versionNumber: nextVersionNumber,
      title: input.title,
      changesSummary: input.changesSummary,
      structuredData: resume.structured_data,
      score: resume.score,
    });

    return toResponse(record);
  }

  async listVersions(resumeId: string, userId: string): Promise<ResumeVersionResponse[]> {
    // Verify the resume belongs to the user before listing its versions.
    const resume = await resumeRepository.findByIdForUser(resumeId, userId);
    if (!resume) {
      throw new AppError('Resume not found', 404, 'NOT_FOUND');
    }

    const records = await resumeVersionRepository.listForResume(resumeId, userId);
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
   * Compare two version snapshots.
   * Score delta and skill diff are computed here in the service layer,
   * not in the repository.
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

    const skillsA = recordA.structured_data?.skills ?? [];
    const skillsB = recordB.structured_data?.skills ?? [];
    const skillDiff = computeSkillDiff(skillsA, skillsB);

    const scoreDelta =
      recordA.score !== null && recordB.score !== null ? recordB.score - recordA.score : null;

    return {
      versionA: toResponse(recordA),
      versionB: toResponse(recordB),
      scoreDelta,
      skillDiff,
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
