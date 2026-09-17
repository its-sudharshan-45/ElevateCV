-- =============================================================================
-- 018_document_legacy_aptitude_coding_tables.sql
-- Audit Annotation: Out-of-Scope Legacy Tables in Migration 015
--
-- PURPOSE:
--   Migration 015 (015_ai_model_management.sql) created both:
--     (A) Active AI infrastructure tables (ai_models, ai_model_revisions,
--         ai_model_health, ai_model_metrics, ai_model_events) — STILL IN USE
--         by the backend AI registry and inference layer.
--     (B) Out-of-scope legacy feature tables that were included at the time
--         but have no active backend or frontend references:
--           - aptitude_questions
--           - aptitude_submissions
--           - coding_challenges
--           - coding_submissions
--           - adaptive_learning_loops
--
-- AUDIT FINDINGS (Phase 2, September 2026):
--   - Zero backend TypeScript references to any of these 5 table names.
--   - Zero frontend references to any of these 5 table names.
--   - adaptive_learning_loops has a FK to public.roadmaps which was dropped
--     in migration 017. The CASCADE on that FK means the column is NULL or
--     the row is unlinked on existing rows (SET NULL declared in 015).
--   - aptitude_questions and coding_challenges have no user FK — they are
--     content bank tables only.
--   - aptitude_submissions, coding_submissions, adaptive_learning_loops
--     have user FKs to auth.users with ON DELETE CASCADE.
--
-- STRATEGY (non-destructive — documentation pass only):
--   Add COMMENT annotations to each table so their deprecated status is
--   permanently visible in Supabase Studio.
--   No tables, columns, policies, or data are dropped in this migration.
--
-- SAFE TO RUN: Yes — only COMMENT ON TABLE statements, fully idempotent.
-- NEXT STEP: A future migration (019) can hard-drop these 5 tables after
--   confirming no user data exists in them and no dependent external systems
--   reference them.
--
-- NOTE: Do NOT modify 015_ai_model_management.sql (historical migration).
-- =============================================================================

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'aptitude_questions'
  ) THEN
    COMMENT ON TABLE public.aptitude_questions IS
      'OUT-OF-SCOPE LEGACY (018): Created in 015 as part of an aptitude testing feature '
      'that was never implemented. No backend or frontend references. '
      'Safe to drop in a future migration after confirming no user data.';
    RAISE NOTICE 'Annotated: aptitude_questions';
  ELSE
    RAISE NOTICE 'Skipped (not found): aptitude_questions';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'aptitude_submissions'
  ) THEN
    COMMENT ON TABLE public.aptitude_submissions IS
      'OUT-OF-SCOPE LEGACY (018): Created in 015. No backend or frontend references. '
      'Safe to drop in a future migration after confirming no user data.';
    RAISE NOTICE 'Annotated: aptitude_submissions';
  ELSE
    RAISE NOTICE 'Skipped (not found): aptitude_submissions';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'coding_challenges'
  ) THEN
    COMMENT ON TABLE public.coding_challenges IS
      'OUT-OF-SCOPE LEGACY (018): Created in 015 as part of a coding challenge feature '
      'that was never implemented. No backend or frontend references. '
      'Safe to drop in a future migration after confirming no user data.';
    RAISE NOTICE 'Annotated: coding_challenges';
  ELSE
    RAISE NOTICE 'Skipped (not found): coding_challenges';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'coding_submissions'
  ) THEN
    COMMENT ON TABLE public.coding_submissions IS
      'OUT-OF-SCOPE LEGACY (018): Created in 015. No backend or frontend references. '
      'Safe to drop in a future migration after confirming no user data.';
    RAISE NOTICE 'Annotated: coding_submissions';
  ELSE
    RAISE NOTICE 'Skipped (not found): coding_submissions';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'adaptive_learning_loops'
  ) THEN
    COMMENT ON TABLE public.adaptive_learning_loops IS
      'OUT-OF-SCOPE LEGACY (018): Created in 015. FK to roadmaps was CASCADE SET NULL '
      'after 017 dropped public.roadmaps. No backend or frontend references. '
      'Safe to drop in a future migration after confirming no user data.';
    RAISE NOTICE 'Annotated: adaptive_learning_loops';
  ELSE
    RAISE NOTICE 'Skipped (not found): adaptive_learning_loops';
  END IF;
END $$;
