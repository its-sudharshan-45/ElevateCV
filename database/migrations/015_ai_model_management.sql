-- cspell:ignore minilm BAAI
-- 015_ai_model_management.sql
-- AI Model Registry, health tracking, metrics, Aptitude bank,
-- Coding challenges, and Adaptive Learning loop tables.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. AI Model Registry
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.ai_models (
  id                  TEXT        PRIMARY KEY,
  name                TEXT,
  description         TEXT,
  hub_provider        TEXT        NOT NULL DEFAULT 'huggingface',
  hub_model_id        TEXT        NOT NULL,
  revision            TEXT        NOT NULL DEFAULT 'main',
  library             TEXT        NOT NULL,
  architecture_type   TEXT        NOT NULL,
  task                TEXT        NOT NULL,
  modality            TEXT        NOT NULL,
  capabilities        JSONB       NOT NULL DEFAULT '{}'::jsonb,
  configuration       JSONB       NOT NULL DEFAULT '{}'::jsonb,
  runtime             JSONB       NOT NULL DEFAULT '{}'::jsonb,
  security            JSONB       NOT NULL DEFAULT '{}'::jsonb,
  status              TEXT        NOT NULL DEFAULT 'discovered' CHECK (
    status IN ('discovered', 'validated', 'active', 'deprecated', 'unavailable', 'failed')
  ),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. AI Model Revisions (version history / drift audit)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.ai_model_revisions (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id        TEXT        NOT NULL REFERENCES public.ai_models (id) ON DELETE CASCADE,
  revision        TEXT        NOT NULL,
  commit_hash     TEXT,
  config_hash     TEXT,
  library_version TEXT,
  promoted_by     TEXT,
  notes           TEXT,
  promoted_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. AI Model Health Records
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.ai_model_health (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id          TEXT        NOT NULL REFERENCES public.ai_models (id) ON DELETE CASCADE,
  status            TEXT        NOT NULL CHECK (status IN ('Healthy', 'Degraded', 'Unavailable', 'Deprecated', 'Failed')),
  latency_ms        INTEGER,
  memory_bytes      BIGINT,
  device            TEXT,
  error_message     TEXT,
  details           JSONB       DEFAULT '{}'::jsonb,
  checked_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. AI Model Metrics (request telemetry)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.ai_model_metrics (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id        TEXT        NOT NULL REFERENCES public.ai_models (id) ON DELETE CASCADE,
  operation       TEXT        NOT NULL,
  latency_ms      INTEGER     NOT NULL,
  device          TEXT,
  success         BOOLEAN     NOT NULL DEFAULT TRUE,
  input_tokens    INTEGER,
  output_tokens   INTEGER,
  memory_bytes    BIGINT,
  recorded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. AI Model Events (lifecycle audit)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.ai_model_events (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id    TEXT        NOT NULL REFERENCES public.ai_models (id) ON DELETE CASCADE,
  event_type  TEXT        NOT NULL,
  details     JSONB       DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Aptitude Questions Bank
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.aptitude_questions (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  topic               TEXT        NOT NULL,
  difficulty          TEXT        NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  question_text       TEXT        NOT NULL,
  options             JSONB       NOT NULL,                -- e.g. ["A", "B", "C", "D"]
  correct_answer      INTEGER     NOT NULL,               -- 0-indexed
  explanation         TEXT        NOT NULL DEFAULT '',
  time_limit_seconds  INTEGER     NOT NULL DEFAULT 90,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. Aptitude Submissions (per-user answers)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.aptitude_submissions (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  question_id         UUID        NOT NULL REFERENCES public.aptitude_questions (id) ON DELETE CASCADE,
  selected_option     INTEGER     NOT NULL,
  is_correct          BOOLEAN     NOT NULL,
  time_spent_seconds  INTEGER     NOT NULL DEFAULT 0,
  submitted_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. Coding Challenges Bank
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.coding_challenges (
  id                      TEXT        PRIMARY KEY,
  title                   TEXT        NOT NULL,
  description             TEXT        NOT NULL,
  difficulty              TEXT        NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  topic                   TEXT        NOT NULL,
  constraints             JSONB       NOT NULL DEFAULT '[]'::jsonb,
  examples                JSONB       NOT NULL DEFAULT '[]'::jsonb,
  test_cases              JSONB       NOT NULL DEFAULT '[]'::jsonb,
  expected_time_complexity TEXT        NOT NULL DEFAULT 'O(n)',
  expected_space_complexity TEXT       NOT NULL DEFAULT 'O(1)',
  supported_languages     JSONB       NOT NULL DEFAULT '["javascript"]'::jsonb,
  starter_code            JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. Coding Submissions
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.coding_submissions (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  challenge_id      TEXT        NOT NULL REFERENCES public.coding_challenges (id) ON DELETE CASCADE,
  language          TEXT        NOT NULL DEFAULT 'javascript',
  status            TEXT        NOT NULL CHECK (status IN ('accepted', 'wrong_answer', 'time_limit_exceeded', 'runtime_error', 'security_violation')),
  passed_tests      INTEGER     NOT NULL DEFAULT 0,
  total_tests       INTEGER     NOT NULL DEFAULT 0,
  execution_time_ms INTEGER,
  submitted_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. Adaptive Learning Loops (performance linkages)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.adaptive_learning_loops (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  roadmap_id            UUID        REFERENCES public.roadmaps (id) ON DELETE SET NULL,
  trigger_source        TEXT        NOT NULL CHECK (trigger_source IN ('ATS_GAP', 'INTERVIEW_WEAKNESS', 'CODING_DEFICIT', 'APTITUDE_DEFICIT')),
  weak_skill            TEXT        NOT NULL,
  action_taken          TEXT,
  resolved              BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at           TIMESTAMPTZ
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_ai_model_health_model ON public.ai_model_health (model_id, checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_model_metrics_model ON public.ai_model_metrics (model_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_aptitude_submissions_user ON public.aptitude_submissions (user_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_coding_submissions_user ON public.coding_submissions (user_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_adaptive_loops_user ON public.adaptive_learning_loops (user_id, created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS Policies
-- ─────────────────────────────────────────────────────────────────────────────

-- ai_models: system-managed, no user RLS needed (service role only)

-- aptitude_submissions
ALTER TABLE public.aptitude_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY aptitude_submissions_select_own ON public.aptitude_submissions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY aptitude_submissions_insert_own ON public.aptitude_submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- coding_submissions
ALTER TABLE public.coding_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY coding_submissions_select_own ON public.coding_submissions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY coding_submissions_insert_own ON public.coding_submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- adaptive_learning_loops
ALTER TABLE public.adaptive_learning_loops ENABLE ROW LEVEL SECURITY;

CREATE POLICY adaptive_loops_select_own ON public.adaptive_learning_loops
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY adaptive_loops_insert_own ON public.adaptive_learning_loops
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY adaptive_loops_update_own ON public.adaptive_learning_loops
  FOR UPDATE USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Seed initial production model registry rows
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.ai_models (id, name, hub_model_id, library, architecture_type, task, modality, status, capabilities, security) VALUES
  (
    'resume-ner',
    'Resume Named Entity Recognizer',
    'oksomu/resume-ner',
    'transformers',
    'token-classification',
    'token-classification',
    'text',
    'active',
    '{"batching": true, "streaming": false, "quantization": true}'::jsonb,
    '{"trusted": true, "allowlisted": true}'::jsonb
  ),
  (
    'embedding-minilm',
    'MiniLM L6 v2 Sentence Embeddings',
    'sentence-transformers/all-MiniLM-L6-v2',
    'sentence-transformers',
    'embeddings',
    'embeddings',
    'text',
    'active',
    '{"batching": true, "streaming": false, "quantization": true}'::jsonb,
    '{"trusted": true, "allowlisted": true}'::jsonb
  ),
  (
    'bge-small-en',
    'BAAI BGE Small English Embeddings',
    'BAAI/bge-small-en-v1.5',
    'sentence-transformers',
    'embeddings',
    'embeddings',
    'text',
    'active',
    '{"batching": true, "streaming": false, "quantization": true}'::jsonb,
    '{"trusted": true, "allowlisted": true}'::jsonb
  )
ON CONFLICT (id) DO NOTHING;
