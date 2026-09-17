import type {
  ProfileRecord,
  ProfileResponse,
  UpdateProfileData,
  UpdateProfileInput,
} from './profile.types.js';

export function mapProfileToResponse(record: ProfileRecord): ProfileResponse {
  return {
    id: record.id,
    fullName: record.full_name,
    headline: record.headline,
    targetRole: record.target_role,
    experienceLevel: record.experience_level,
    dsaScore: record.dsa_score ?? 0,
    college: record.college,
    degree: record.degree,
    fieldOfStudy: record.field_of_study,
    graduationYear: record.graduation_year,
    currentStatus: record.current_status,
    skills: record.skills ?? [],
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

export function mapUpdateInputToData(input: UpdateProfileInput): UpdateProfileData {
  const data: UpdateProfileData = {};

  if (input.fullName !== undefined) {
    data.full_name = input.fullName;
  }

  if (input.headline !== undefined) {
    data.headline = input.headline;
  }

  if (input.targetRole !== undefined) {
    data.target_role = input.targetRole;
  }

  if (input.experienceLevel !== undefined) {
    data.experience_level = input.experienceLevel;
  }

  if (input.dsaScore !== undefined) {
    data.dsa_score = input.dsaScore;
  }

  if (input.college !== undefined) {
    data.college = input.college;
  }

  if (input.degree !== undefined) {
    data.degree = input.degree;
  }

  if (input.fieldOfStudy !== undefined) {
    data.field_of_study = input.fieldOfStudy;
  }

  if (input.graduationYear !== undefined) {
    data.graduation_year = input.graduationYear;
  }

  if (input.currentStatus !== undefined) {
    data.current_status = input.currentStatus;
  }

  if (input.skills !== undefined) {
    data.skills = input.skills;
  }

  return data;
}
