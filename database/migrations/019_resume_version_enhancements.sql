-- 019_resume_version_enhancements.sql
-- Immutable resume version enhancements: source tracking and single-current-version enforcement.

-- 1. Add source column to track version origin: 'ORIGINAL' | 'AI_OPTIMIZED' | 'MANUAL_EDIT' | 'RESTORED'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'resume_versions' AND column_name = 'source'
  ) THEN
    ALTER TABLE public.resume_versions
      ADD COLUMN source TEXT NOT NULL DEFAULT 'ORIGINAL'
      CHECK (source IN ('ORIGINAL', 'AI_OPTIMIZED', 'MANUAL_EDIT', 'RESTORED'));
  END IF;

  -- 2. Add is_current boolean flag (only one version per resume may be true)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'resume_versions' AND column_name = 'is_current'
  ) THEN
    ALTER TABLE public.resume_versions
      ADD COLUMN is_current BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;

-- 3. Partial unique index ensuring at most one version per resume is current
CREATE UNIQUE INDEX IF NOT EXISTS idx_resume_versions_one_current 
  ON public.resume_versions (resume_id) 
  WHERE is_current = true;

-- 4. Index on source for version history filtering
CREATE INDEX IF NOT EXISTS idx_resume_versions_source 
  ON public.resume_versions (resume_id, source);
