-- =============================================================================
-- 016_deprecate_legacy_tables.sql
-- Phase 1: Soft Deprecation of Legacy Feature Tables
--
-- PURPOSE:
--   Safely marks 16 tables as deprecated following the removal of the following
--   product features: Job Board, Learning Roadmap, Application Tracking,
--   Interview Simulator, Career Readiness Score, and RAG Career Assistant.
--
-- STRATEGY (non-destructive):
--   1. Add a `deprecated_at` timestamp column to each legacy table so the
--      deprecation intent is permanently recorded in the schema.
--   2. Drop all INSERT / UPDATE / DELETE RLS policies — this blocks any new
--      data from being written to these tables via Supabase clients.
--   3. Preserve SELECT policies so existing data can still be read and exported
--      before Phase 2 (hard delete) is executed.
--   4. Add table-level COMMENT annotations visible in Supabase Studio.
--
-- IDEMPOTENT: Yes — every block checks IF EXISTS before altering.
-- SAFE TO RUN: Yes — does not drop any tables or columns.
-- RUN PHASE 2:  017_drop_legacy_tables.sql (after confirming no data to keep)
-- =============================================================================

BEGIN;

-- =============================================================================
-- 004 REMNANTS: job_postings, job_matches
-- =============================================================================

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'job_postings') THEN
    ALTER TABLE public.job_postings
      ADD COLUMN IF NOT EXISTS deprecated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

    COMMENT ON TABLE public.job_postings IS
      'DEPRECATED (016): Legacy job board table. No active backend module. '
      'Pending removal in migration 017. Do not write new data.';

    DROP POLICY IF EXISTS job_postings_insert_own ON public.job_postings;
    DROP POLICY IF EXISTS job_postings_update_own ON public.job_postings;
    DROP POLICY IF EXISTS job_postings_delete_own ON public.job_postings;

    RAISE NOTICE 'Deprecated: job_postings';
  ELSE
    RAISE NOTICE 'Skipped (not found): job_postings';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'job_matches') THEN
    ALTER TABLE public.job_matches
      ADD COLUMN IF NOT EXISTS deprecated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

    COMMENT ON TABLE public.job_matches IS
      'DEPRECATED (016): Legacy job match results. Superseded by resume_job_analysis '
      '(migration 014). No active backend module. Pending removal in migration 017.';

    DROP POLICY IF EXISTS job_matches_insert_own ON public.job_matches;
    DROP POLICY IF EXISTS job_matches_update_own ON public.job_matches;
    DROP POLICY IF EXISTS job_matches_delete_own ON public.job_matches;

    RAISE NOTICE 'Deprecated: job_matches';
  ELSE
    RAISE NOTICE 'Skipped (not found): job_matches';
  END IF;
END $$;

-- =============================================================================
-- 005 REMNANTS: learning_resources, roadmaps, roadmap_stages, roadmap_tasks
-- =============================================================================

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'learning_resources') THEN
    ALTER TABLE public.learning_resources
      ADD COLUMN IF NOT EXISTS deprecated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

    COMMENT ON TABLE public.learning_resources IS
      'DEPRECATED (016): Learning resource catalog for deleted roadmap feature. '
      'Pending removal in migration 017.';

    -- learning_resources had SELECT-only for authenticated users; no write policies to drop
    DROP POLICY IF EXISTS learning_resources_select_authenticated ON public.learning_resources;

    RAISE NOTICE 'Deprecated: learning_resources';
  ELSE
    RAISE NOTICE 'Skipped (not found): learning_resources';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'roadmaps') THEN
    ALTER TABLE public.roadmaps
      ADD COLUMN IF NOT EXISTS deprecated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

    COMMENT ON TABLE public.roadmaps IS
      'DEPRECATED (016): Learning roadmap feature removed. '
      'Pending removal in migration 017. Do not write new data.';

    DROP POLICY IF EXISTS roadmaps_insert_own ON public.roadmaps;
    DROP POLICY IF EXISTS roadmaps_update_own ON public.roadmaps;
    DROP POLICY IF EXISTS roadmaps_delete_own ON public.roadmaps;

    RAISE NOTICE 'Deprecated: roadmaps';
  ELSE
    RAISE NOTICE 'Skipped (not found): roadmaps';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'roadmap_stages') THEN
    ALTER TABLE public.roadmap_stages
      ADD COLUMN IF NOT EXISTS deprecated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

    COMMENT ON TABLE public.roadmap_stages IS
      'DEPRECATED (016): Learning roadmap stages. Pending removal in migration 017.';

    DROP POLICY IF EXISTS roadmap_stages_insert_own ON public.roadmap_stages;
    DROP POLICY IF EXISTS roadmap_stages_update_own ON public.roadmap_stages;
    DROP POLICY IF EXISTS roadmap_stages_delete_own ON public.roadmap_stages;

    RAISE NOTICE 'Deprecated: roadmap_stages';
  ELSE
    RAISE NOTICE 'Skipped (not found): roadmap_stages';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'roadmap_tasks') THEN
    ALTER TABLE public.roadmap_tasks
      ADD COLUMN IF NOT EXISTS deprecated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

    COMMENT ON TABLE public.roadmap_tasks IS
      'DEPRECATED (016): Learning roadmap tasks. Pending removal in migration 017.';

    DROP POLICY IF EXISTS roadmap_tasks_insert_own ON public.roadmap_tasks;
    DROP POLICY IF EXISTS roadmap_tasks_update_own ON public.roadmap_tasks;
    DROP POLICY IF EXISTS roadmap_tasks_delete_own ON public.roadmap_tasks;

    RAISE NOTICE 'Deprecated: roadmap_tasks';
  ELSE
    RAISE NOTICE 'Skipped (not found): roadmap_tasks';
  END IF;
END $$;

-- =============================================================================
-- 008 REMNANTS: applications, application_events
-- =============================================================================

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'applications') THEN
    ALTER TABLE public.applications
      ADD COLUMN IF NOT EXISTS deprecated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

    COMMENT ON TABLE public.applications IS
      'DEPRECATED (016): Job application tracking feature removed. '
      'Pending removal in migration 017. Do not write new data.';

    DROP POLICY IF EXISTS applications_insert_own ON public.applications;
    DROP POLICY IF EXISTS applications_update_own ON public.applications;
    DROP POLICY IF EXISTS applications_delete_own ON public.applications;

    RAISE NOTICE 'Deprecated: applications';
  ELSE
    RAISE NOTICE 'Skipped (not found): applications';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'application_events') THEN
    ALTER TABLE public.application_events
      ADD COLUMN IF NOT EXISTS deprecated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

    COMMENT ON TABLE public.application_events IS
      'DEPRECATED (016): Application event audit log for deleted tracking feature. '
      'Pending removal in migration 017.';

    DROP POLICY IF EXISTS application_events_insert_own ON public.application_events;

    RAISE NOTICE 'Deprecated: application_events';
  ELSE
    RAISE NOTICE 'Skipped (not found): application_events';
  END IF;
END $$;

-- =============================================================================
-- 009 REMNANTS: interviews, interview_questions, interview_answers
-- =============================================================================

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'interviews') THEN
    ALTER TABLE public.interviews
      ADD COLUMN IF NOT EXISTS deprecated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

    COMMENT ON TABLE public.interviews IS
      'DEPRECATED (016): AI mock interview simulator feature removed. '
      'Pending removal in migration 017. Do not write new data.';

    DROP POLICY IF EXISTS interviews_insert_own ON public.interviews;
    DROP POLICY IF EXISTS interviews_update_own ON public.interviews;
    DROP POLICY IF EXISTS interviews_delete_own ON public.interviews;

    RAISE NOTICE 'Deprecated: interviews';
  ELSE
    RAISE NOTICE 'Skipped (not found): interviews';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'interview_questions') THEN
    ALTER TABLE public.interview_questions
      ADD COLUMN IF NOT EXISTS deprecated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

    COMMENT ON TABLE public.interview_questions IS
      'DEPRECATED (016): Interview questions for deleted simulator feature. '
      'Pending removal in migration 017.';

    DROP POLICY IF EXISTS interview_questions_insert_own ON public.interview_questions;

    RAISE NOTICE 'Deprecated: interview_questions';
  ELSE
    RAISE NOTICE 'Skipped (not found): interview_questions';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'interview_answers') THEN
    ALTER TABLE public.interview_answers
      ADD COLUMN IF NOT EXISTS deprecated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

    COMMENT ON TABLE public.interview_answers IS
      'DEPRECATED (016): Interview answers for deleted simulator feature. '
      'Pending removal in migration 017.';

    DROP POLICY IF EXISTS interview_answers_insert_own ON public.interview_answers;

    RAISE NOTICE 'Deprecated: interview_answers';
  ELSE
    RAISE NOTICE 'Skipped (not found): interview_answers';
  END IF;
END $$;

-- =============================================================================
-- 010 REMNANTS: readiness_scores
-- =============================================================================

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'readiness_scores') THEN
    ALTER TABLE public.readiness_scores
      ADD COLUMN IF NOT EXISTS deprecated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

    COMMENT ON TABLE public.readiness_scores IS
      'DEPRECATED (016): Career Readiness Score feature removed. '
      'Pending removal in migration 017. Do not write new data.';

    DROP POLICY IF EXISTS readiness_scores_insert_own ON public.readiness_scores;

    RAISE NOTICE 'Deprecated: readiness_scores';
  ELSE
    RAISE NOTICE 'Skipped (not found): readiness_scores';
  END IF;
END $$;

-- =============================================================================
-- 011 REMNANTS: rag_documents, rag_document_chunks, ai_conversations, ai_messages
-- =============================================================================

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'rag_documents') THEN
    ALTER TABLE public.rag_documents
      ADD COLUMN IF NOT EXISTS deprecated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

    COMMENT ON TABLE public.rag_documents IS
      'DEPRECATED (016): RAG Career Assistant vector document store. '
      'Feature removed. Pending deletion in migration 017.';

    DROP POLICY IF EXISTS rag_documents_insert_own ON public.rag_documents;
    DROP POLICY IF EXISTS rag_documents_update_own ON public.rag_documents;
    DROP POLICY IF EXISTS rag_documents_delete_own ON public.rag_documents;

    RAISE NOTICE 'Deprecated: rag_documents';
  ELSE
    RAISE NOTICE 'Skipped (not found): rag_documents';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'rag_document_chunks') THEN
    ALTER TABLE public.rag_document_chunks
      ADD COLUMN IF NOT EXISTS deprecated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

    COMMENT ON TABLE public.rag_document_chunks IS
      'DEPRECATED (016): RAG vector chunks (embeddings). '
      'Feature removed. Pending deletion in migration 017.';

    DROP POLICY IF EXISTS rag_document_chunks_insert_own ON public.rag_document_chunks;
    DROP POLICY IF EXISTS rag_document_chunks_delete_own ON public.rag_document_chunks;

    RAISE NOTICE 'Deprecated: rag_document_chunks';
  ELSE
    RAISE NOTICE 'Skipped (not found): rag_document_chunks';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ai_conversations') THEN
    ALTER TABLE public.ai_conversations
      ADD COLUMN IF NOT EXISTS deprecated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

    COMMENT ON TABLE public.ai_conversations IS
      'DEPRECATED (016): AI Career Assistant conversation history. '
      'Feature removed. Pending deletion in migration 017.';

    DROP POLICY IF EXISTS ai_conversations_insert_own ON public.ai_conversations;
    DROP POLICY IF EXISTS ai_conversations_update_own ON public.ai_conversations;
    DROP POLICY IF EXISTS ai_conversations_delete_own ON public.ai_conversations;

    RAISE NOTICE 'Deprecated: ai_conversations';
  ELSE
    RAISE NOTICE 'Skipped (not found): ai_conversations';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ai_messages') THEN
    ALTER TABLE public.ai_messages
      ADD COLUMN IF NOT EXISTS deprecated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

    COMMENT ON TABLE public.ai_messages IS
      'DEPRECATED (016): AI Career Assistant message history. '
      'Feature removed. Pending deletion in migration 017.';

    DROP POLICY IF EXISTS ai_messages_insert_own ON public.ai_messages;
    DROP POLICY IF EXISTS ai_messages_delete_own ON public.ai_messages;

    RAISE NOTICE 'Deprecated: ai_messages';
  ELSE
    RAISE NOTICE 'Skipped (not found): ai_messages';
  END IF;
END $$;

-- =============================================================================
-- profiles.dsa_score column — added by migration 008, no active usage
-- =============================================================================

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'dsa_score'
  ) THEN
    COMMENT ON COLUMN public.profiles.dsa_score IS
      'DEPRECATED (016): DSA score field added for readiness/interview features '
      'which have been removed. Pending column drop in migration 017.';

    RAISE NOTICE 'Deprecated column: profiles.dsa_score';
  ELSE
    RAISE NOTICE 'Skipped (not found): profiles.dsa_score';
  END IF;
END $$;

COMMIT;
