-- 013_profile_extended_fields.sql
-- Extend profiles with education, career status, skills, and avatar fields
-- required for career recommendations, resume matching, and job recommendations.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS college          TEXT,
  ADD COLUMN IF NOT EXISTS degree           TEXT,
  ADD COLUMN IF NOT EXISTS field_of_study   TEXT,
  ADD COLUMN IF NOT EXISTS graduation_year  SMALLINT CHECK (graduation_year >= 1950 AND graduation_year <= 2099),
  ADD COLUMN IF NOT EXISTS current_status   TEXT CHECK (
    current_status IN ('student', 'fresher', 'working_professional')
  ),
  ADD COLUMN IF NOT EXISTS skills           TEXT[] NOT NULL DEFAULT '{}';

-- Improve job-matching query performance on the new columns
CREATE INDEX IF NOT EXISTS idx_profiles_current_status ON public.profiles (current_status);
CREATE INDEX IF NOT EXISTS idx_profiles_graduation_year ON public.profiles (graduation_year);
