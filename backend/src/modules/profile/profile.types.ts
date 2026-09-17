export type ExperienceLevel = 'student' | 'intern' | 'early_career' | 'career_switcher';
export type CurrentStatus = 'student' | 'fresher' | 'working_professional';

export interface ProfileRecord {
  id: string;
  full_name: string | null;
  headline: string | null;
  target_role: string | null;
  experience_level: ExperienceLevel | null;
  dsa_score?: number | null;
  college: string | null;
  degree: string | null;
  field_of_study: string | null;
  graduation_year: number | null;
  current_status: CurrentStatus | null;
  skills: string[];
  created_at: string;
  updated_at: string;
}

export interface ProfileResponse {
  id: string;
  fullName: string | null;
  headline: string | null;
  targetRole: string | null;
  experienceLevel: ExperienceLevel | null;
  dsaScore: number;
  college: string | null;
  degree: string | null;
  fieldOfStudy: string | null;
  graduationYear: number | null;
  currentStatus: CurrentStatus | null;
  skills: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileInput {
  fullName?: string;
  headline?: string | null;
  targetRole?: string | null;
  experienceLevel?: ExperienceLevel | null;
  dsaScore?: number;
  college?: string | null;
  degree?: string | null;
  fieldOfStudy?: string | null;
  graduationYear?: number | null;
  currentStatus?: CurrentStatus | null;
  skills?: string[];
}

export interface UpdateProfileData {
  full_name?: string;
  headline?: string | null;
  target_role?: string | null;
  experience_level?: ExperienceLevel | null;
  dsa_score?: number;
  college?: string | null;
  degree?: string | null;
  field_of_study?: string | null;
  graduation_year?: number | null;
  current_status?: CurrentStatus | null;
  skills?: string[];
}
