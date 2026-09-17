export type ExperienceLevel = 'student' | 'intern' | 'early_career' | 'career_switcher';
export type CurrentStatus = 'student' | 'fresher' | 'working_professional';

export interface Profile {
  id: string;
  fullName: string | null;
  headline: string | null;
  targetRole: string | null;
  experienceLevel: ExperienceLevel | null;
  dsaScore?: number;
  college: string | null;
  degree: string | null;
  fieldOfStudy: string | null;
  graduationYear: number | null;
  currentStatus: CurrentStatus | null;
  skills: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProfileResponse {
  profile: Profile;
}

export const EXPERIENCE_LEVEL_OPTIONS: Array<{ value: ExperienceLevel; label: string }> = [
  { value: 'student', label: 'Student' },
  { value: 'intern', label: 'Intern' },
  { value: 'early_career', label: 'Early career (0–2 yrs)' },
  { value: 'career_switcher', label: 'Career switcher' },
];

export const CURRENT_STATUS_OPTIONS: Array<{ value: CurrentStatus; label: string }> = [
  { value: 'student', label: 'Student' },
  { value: 'fresher', label: 'Fresher' },
  { value: 'working_professional', label: 'Working Professional' },
];
