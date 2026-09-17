-- 006_resume_versioning.sql
-- Immutable resume version snapshots created explicitly by the authenticated user.
-- A version is a point-in-time snapshot of a processed resume record's data.

CREATE TABLE IF NOT EXISTS public.resume_versions (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id        UUID        NOT NULL REFERENCES public.resumes (id) ON DELETE CASCADE,
  user_id          UUID        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  version_number   INTEGER     NOT NULL CHECK (version_number >= 1),
  title            TEXT        NOT NULL DEFAULT '',
  changes_summary  TEXT        NOT NULL DEFAULT '',
  structured_data  JSONB,
  score            INTEGER     CHECK (score IS NULL OR (score >= 0 AND score <= 100)),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT resume_versions_unique_number UNIQUE (resume_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_resume_versions_resume_id
  ON public.resume_versions (resume_id);

CREATE INDEX IF NOT EXISTS idx_resume_versions_user_id
  ON public.resume_versions (user_id);

CREATE INDEX IF NOT EXISTS idx_resume_versions_user_created
  ON public.resume_versions (user_id, created_at DESC);

ALTER TABLE public.resume_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY resume_versions_select_own
  ON public.resume_versions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY resume_versions_insert_own
  ON public.resume_versions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY resume_versions_update_own
  ON public.resume_versions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY resume_versions_delete_own
  ON public.resume_versions
  FOR DELETE
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS resume_versions_set_updated_at ON public.resume_versions;

CREATE TRIGGER resume_versions_set_updated_at
  BEFORE UPDATE ON public.resume_versions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
