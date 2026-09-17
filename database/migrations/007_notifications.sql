-- 007_notifications.sql
-- User notification records delivered via REST API.
-- Supports types: ROADMAP_PROGRESS, RESUME_ANALYSIS, JOB_MATCH, SYSTEM.

CREATE TYPE public.notification_type AS ENUM (
  'ROADMAP_PROGRESS',
  'RESUME_ANALYSIS',
  'JOB_MATCH',
  'SYSTEM'
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID                      PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID                      NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  title      TEXT                      NOT NULL,
  message    TEXT                      NOT NULL DEFAULT '',
  type       public.notification_type  NOT NULL DEFAULT 'SYSTEM',
  read       BOOLEAN                   NOT NULL DEFAULT FALSE,
  metadata   JSONB,
  created_at TIMESTAMPTZ               NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ               NOT NULL DEFAULT NOW()
);

-- Composite index for unread-count and list queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_read
  ON public.notifications (user_id, read);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON public.notifications (user_id, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY notifications_select_own
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY notifications_insert_own
  ON public.notifications
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY notifications_update_own
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY notifications_delete_own
  ON public.notifications
  FOR DELETE
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS notifications_set_updated_at ON public.notifications;

CREATE TRIGGER notifications_set_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
