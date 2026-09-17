-- 014_resume_job_analysis.sql
-- Stores Job-Specific ATS Resume Analysis results matching a resume against a target job description.

CREATE TABLE IF NOT EXISTS public.resume_job_analysis (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resume_id        UUID NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
  job_title        TEXT,
  job_description  TEXT NOT NULL,
  job_requirements JSONB,
  match_score      SMALLINT NOT NULL CHECK (match_score >= 0 AND match_score <= 100),
  analysis_result  JSONB,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indices for rapid lookup by user and resume
CREATE INDEX IF NOT EXISTS idx_rja_user_resume ON public.resume_job_analysis (user_id, resume_id);
CREATE INDEX IF NOT EXISTS idx_rja_created_at ON public.resume_job_analysis (created_at DESC);

-- Enable RLS
ALTER TABLE public.resume_job_analysis ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own job analyses"
  ON public.resume_job_analysis
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own job analyses"
  ON public.resume_job_analysis
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own job analyses"
  ON public.resume_job_analysis
  FOR DELETE
  USING (auth.uid() = user_id);
