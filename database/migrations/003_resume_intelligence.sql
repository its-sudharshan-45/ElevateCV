-- 003_resume_intelligence.sql
-- Resume metadata, processing state, and user-owned RLS policies.
--
-- Storage bucket setup (run once in Supabase Dashboard or via SQL):
--   1. Create private bucket named by RESUME_STORAGE_BUCKET (default: resumes)
--   2. Apply storage policies below after bucket creation

CREATE TYPE public.resume_processing_status AS ENUM (
  'UPLOADED',
  'PROCESSING',
  'PROCESSED',
  'FAILED'
);

CREATE TABLE IF NOT EXISTS public.resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  original_filename TEXT NOT NULL,
  storage_path TEXT NOT NULL UNIQUE,
  mime_type TEXT NOT NULL,
  file_size INTEGER NOT NULL CHECK (file_size > 0),
  processing_status public.resume_processing_status NOT NULL DEFAULT 'UPLOADED',
  extracted_text TEXT,
  structured_data JSONB,
  analysis_result JSONB,
  score INTEGER CHECK (score IS NULL OR (score >= 0 AND score <= 100)),
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON public.resumes (user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_user_created_at ON public.resumes (user_id, created_at DESC);

ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

CREATE POLICY resumes_select_own
  ON public.resumes
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY resumes_insert_own
  ON public.resumes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY resumes_update_own
  ON public.resumes
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY resumes_delete_own
  ON public.resumes
  FOR DELETE
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS resumes_set_updated_at ON public.resumes;

CREATE TRIGGER resumes_set_updated_at
  BEFORE UPDATE ON public.resumes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Optional Supabase Storage policies (private bucket: resumes)
-- Uncomment after creating the bucket in Supabase Storage.
--
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('resumes', 'resumes', false)
-- ON CONFLICT (id) DO NOTHING;
--
-- CREATE POLICY resume_storage_select_own
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);
--
-- CREATE POLICY resume_storage_insert_own
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);
--
-- CREATE POLICY resume_storage_delete_own
--   ON storage.objects FOR DELETE
--   USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);
