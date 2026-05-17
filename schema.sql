-- =============================================================================
-- schema.sql
-- Full database schema for ada-liftinguk.com
-- Generated from all Supabase migrations (run top-to-bottom on a clean database)
--
-- Execution order:
--   1. Extensions
--   2. ENUMs
--   3. set_updated_at() — no table deps, needed by triggers later
--   4. Tables + ENABLE ROW LEVEL SECURITY (each table immediately after CREATE)
--   5. has_role() + handle_new_user() — LANGUAGE SQL body validated at creation,
--      so user_roles / profiles must exist first
--   6. RLS policies — reference has_role(), so function must exist first
--   7. Triggers — reference set_updated_at() and handle_new_user()
--   8. Email queue RPC functions + grants
--   9. Storage buckets + policies
--  10. Realtime publications
--  11. Email queues (pgmq)
--  12. Seed data
-- =============================================================================


-- =============================================================================
-- 1. EXTENSIONS
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    CREATE EXTENSION pg_cron;
  END IF;
END $$;

CREATE EXTENSION IF NOT EXISTS supabase_vault;
CREATE EXTENSION IF NOT EXISTS pgmq;


-- =============================================================================
-- 2. ENUMS
-- =============================================================================

CREATE TYPE public.app_role AS ENUM (
  'client',
  'appointed_person',
  'admin'
);

CREATE TYPE public.lift_plan_status AS ENUM (
  'submitted',
  'assigned',
  'in_review',
  'request_info',
  'rejected',
  'completed'
);

CREATE TYPE public.lift_plan_write_status AS ENUM (
  'submitted',
  'assigned',
  'request_info',
  'draft_delivered',
  'completed'
);

CREATE TYPE public.equipment_type AS ENUM (
  'tower_crane',
  'mobile_crane',
  'digger',
  'forklift',
  'hiab',
  'mewp'
);

CREATE TYPE public.timeframe_type AS ENUM (
  '24h',
  '48h',
  '72h'
);

CREATE TYPE public.payment_type AS ENUM (
  'po',
  'direct'
);

CREATE TYPE public.payment_status AS ENUM (
  'pending',
  'paid',
  'po_recorded'
);

CREATE TYPE public.service_kind AS ENUM (
  'review',
  'write'
);


-- =============================================================================
-- 3. TRIGGER HELPER  (no table references — safe to define before any table)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


-- =============================================================================
-- 4. TABLES  (each followed immediately by ENABLE ROW LEVEL SECURITY)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- profiles
-- -----------------------------------------------------------------------------
CREATE TABLE public.profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT        NOT NULL,
  email       TEXT        NOT NULL,
  company     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- user_roles
-- -----------------------------------------------------------------------------
CREATE TABLE public.user_roles (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        app_role    NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- lift_plans
-- -----------------------------------------------------------------------------
CREATE TABLE public.lift_plans (
  id             UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id      UUID             NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_to    UUID             REFERENCES auth.users(id) ON DELETE SET NULL,
  reference      TEXT             NOT NULL,
  description    TEXT,
  status         lift_plan_status NOT NULL DEFAULT 'submitted',
  equipment_type equipment_type   NOT NULL,
  timeframe      timeframe_type   NOT NULL,
  payment_type   payment_type     NOT NULL,
  payment_status payment_status   NOT NULL DEFAULT 'pending',
  po_number      TEXT,
  price          NUMERIC(10, 2),
  due_date       TIMESTAMPTZ,
  assigned_at    TIMESTAMPTZ,
  completed_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ      NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ      NOT NULL DEFAULT now()
);

ALTER TABLE public.lift_plans ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- lift_plan_files
-- -----------------------------------------------------------------------------
CREATE TABLE public.lift_plan_files (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  lift_plan_id       UUID        NOT NULL REFERENCES public.lift_plans(id) ON DELETE CASCADE,
  uploaded_by        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_path          TEXT        NOT NULL,
  file_name          TEXT        NOT NULL,
  file_size          BIGINT,
  mime_type          TEXT,
  is_review_document BOOLEAN     NOT NULL DEFAULT false,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.lift_plan_files ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- status_history
-- -----------------------------------------------------------------------------
CREATE TABLE public.status_history (
  id           UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  lift_plan_id UUID             NOT NULL REFERENCES public.lift_plans(id) ON DELETE CASCADE,
  changed_by   UUID             NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_status  lift_plan_status,
  to_status    lift_plan_status NOT NULL,
  note         TEXT,
  created_at   TIMESTAMPTZ      NOT NULL DEFAULT now()
);

ALTER TABLE public.status_history ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- messages  (review-request chat; realtime enabled)
-- -----------------------------------------------------------------------------
CREATE TABLE public.messages (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  lift_plan_id UUID        NOT NULL REFERENCES public.lift_plans(id) ON DELETE CASCADE,
  sender_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body         TEXT        NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- -----------------------------------------------------------------------------
-- lift_plan_writes  (write-a-lift-plan requests)
-- client_id / assigned_to are plain UUIDs without FK constraints
-- (matching the original migration intent).
-- -----------------------------------------------------------------------------
CREATE TABLE public.lift_plan_writes (
  id             UUID                   PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id      UUID                   NOT NULL,
  assigned_to    UUID,
  reference      TEXT                   NOT NULL,
  equipment_type equipment_type         NOT NULL,
  timeframe      timeframe_type         NOT NULL,
  payment_type   payment_type           NOT NULL,
  payment_status payment_status         NOT NULL DEFAULT 'pending',
  po_number      TEXT,
  price          NUMERIC,
  details        TEXT                   NOT NULL,
  status         lift_plan_write_status NOT NULL DEFAULT 'submitted',
  due_date       TIMESTAMPTZ,
  assigned_at    TIMESTAMPTZ,
  completed_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ            NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ            NOT NULL DEFAULT now()
);

ALTER TABLE public.lift_plan_writes ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- lift_plan_write_files
-- uploaded_by is a plain UUID without an explicit FK (matching original).
-- -----------------------------------------------------------------------------
CREATE TABLE public.lift_plan_write_files (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  lift_plan_write_id UUID        NOT NULL REFERENCES public.lift_plan_writes(id) ON DELETE CASCADE,
  uploaded_by        UUID        NOT NULL,
  file_name          TEXT        NOT NULL,
  file_path          TEXT        NOT NULL,
  file_size          BIGINT,
  mime_type          TEXT,
  is_deliverable     BOOLEAN     NOT NULL DEFAULT false,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.lift_plan_write_files ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- write_messages  (write-request chat; realtime enabled)
-- sender_id is a plain UUID without an explicit FK (matching original).
-- -----------------------------------------------------------------------------
CREATE TABLE public.write_messages (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  lift_plan_write_id UUID        NOT NULL REFERENCES public.lift_plan_writes(id) ON DELETE CASCADE,
  sender_id          UUID        NOT NULL,
  body               TEXT        NOT NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.write_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.write_messages REPLICA IDENTITY FULL;

-- -----------------------------------------------------------------------------
-- service_pricing
-- -----------------------------------------------------------------------------
CREATE TABLE public.service_pricing (
  id             UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  service        service_kind   NOT NULL,
  equipment_type equipment_type NOT NULL,
  price          NUMERIC        NOT NULL DEFAULT 0,
  updated_by     UUID,
  created_at     TIMESTAMPTZ    NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ    NOT NULL DEFAULT now(),
  UNIQUE (service, equipment_type)
);

ALTER TABLE public.service_pricing ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- email_send_log
-- -----------------------------------------------------------------------------
CREATE TABLE public.email_send_log (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id      TEXT,
  template_name   TEXT        NOT NULL,
  recipient_email TEXT        NOT NULL,
  status          TEXT        NOT NULL
                              CHECK (status IN ('pending', 'sent', 'suppressed', 'failed', 'bounced', 'complained', 'dlq')),
  error_message   TEXT,
  metadata        JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.email_send_log ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_email_send_log_created   ON public.email_send_log(created_at DESC);
CREATE INDEX idx_email_send_log_recipient ON public.email_send_log(recipient_email);
CREATE INDEX idx_email_send_log_message   ON public.email_send_log(message_id);

-- Prevents race-condition duplicate sends for the same message_id
CREATE UNIQUE INDEX idx_email_send_log_message_sent_unique
  ON public.email_send_log(message_id)
  WHERE status = 'sent';

-- -----------------------------------------------------------------------------
-- email_send_state  (singleton rate-limit / config row)
-- -----------------------------------------------------------------------------
CREATE TABLE public.email_send_state (
  id                              INT         PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  retry_after_until               TIMESTAMPTZ,
  batch_size                      INTEGER     NOT NULL DEFAULT 10,
  send_delay_ms                   INTEGER     NOT NULL DEFAULT 200,
  auth_email_ttl_minutes          INTEGER     NOT NULL DEFAULT 15,
  transactional_email_ttl_minutes INTEGER     NOT NULL DEFAULT 60,
  updated_at                      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.email_send_state ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- suppressed_emails  (bounces, complaints, unsubscribes — append-only)
-- -----------------------------------------------------------------------------
CREATE TABLE public.suppressed_emails (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT        NOT NULL,
  reason     TEXT        NOT NULL CHECK (reason IN ('unsubscribe', 'bounce', 'complaint')),
  metadata   JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (email)
);

ALTER TABLE public.suppressed_emails ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_suppressed_emails_email ON public.suppressed_emails(email);

-- -----------------------------------------------------------------------------
-- email_unsubscribe_tokens
-- -----------------------------------------------------------------------------
CREATE TABLE public.email_unsubscribe_tokens (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  token      TEXT        NOT NULL UNIQUE,
  email      TEXT        NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  used_at    TIMESTAMPTZ
);

ALTER TABLE public.email_unsubscribe_tokens ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_unsubscribe_tokens_token ON public.email_unsubscribe_tokens(token);


-- =============================================================================
-- 5. FUNCTIONS THAT REFERENCE TABLES
--    Placed here because LANGUAGE SQL bodies are validated at creation time —
--    user_roles and profiles must already exist.
-- =============================================================================

-- Role-check helper used in every RLS policy
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Auto-creates a profile row and assigns the default 'client' role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, company)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'company', '')
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'client');
  RETURN NEW;
END;
$$;


-- =============================================================================
-- 6. RLS POLICIES  (has_role() now exists)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- profiles
-- -----------------------------------------------------------------------------
CREATE POLICY "users view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "reviewers view all profiles"
  ON public.profiles FOR SELECT
  USING (
    public.has_role(auth.uid(), 'appointed_person')
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "users update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- -----------------------------------------------------------------------------
-- user_roles
-- -----------------------------------------------------------------------------
CREATE POLICY "users view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "admins view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- -----------------------------------------------------------------------------
-- lift_plans
-- -----------------------------------------------------------------------------
CREATE POLICY "clients view own plans"
  ON public.lift_plans FOR SELECT
  USING (auth.uid() = client_id);

CREATE POLICY "reviewers view all plans"
  ON public.lift_plans FOR SELECT
  USING (
    public.has_role(auth.uid(), 'appointed_person')
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "clients create plans"
  ON public.lift_plans FOR INSERT
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "reviewers update plans"
  ON public.lift_plans FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'appointed_person')
    OR public.has_role(auth.uid(), 'admin')
  );

-- -----------------------------------------------------------------------------
-- lift_plan_files
-- -----------------------------------------------------------------------------
CREATE POLICY "view files of accessible plans"
  ON public.lift_plan_files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.lift_plans p
      WHERE p.id = lift_plan_id
        AND (
          p.client_id = auth.uid()
          OR public.has_role(auth.uid(), 'appointed_person')
          OR public.has_role(auth.uid(), 'admin')
        )
    )
  );

CREATE POLICY "upload files to accessible plans"
  ON public.lift_plan_files FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.lift_plans p
      WHERE p.id = lift_plan_id
        AND (
          p.client_id = auth.uid()
          OR public.has_role(auth.uid(), 'appointed_person')
          OR public.has_role(auth.uid(), 'admin')
        )
    )
  );

-- -----------------------------------------------------------------------------
-- status_history
-- -----------------------------------------------------------------------------
CREATE POLICY "view history of accessible plans"
  ON public.status_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.lift_plans p
      WHERE p.id = lift_plan_id
        AND (
          p.client_id = auth.uid()
          OR public.has_role(auth.uid(), 'appointed_person')
          OR public.has_role(auth.uid(), 'admin')
        )
    )
  );

CREATE POLICY "reviewers add history"
  ON public.status_history FOR INSERT
  WITH CHECK (
    changed_by = auth.uid()
    AND (
      public.has_role(auth.uid(), 'appointed_person')
      OR public.has_role(auth.uid(), 'admin')
    )
  );

-- -----------------------------------------------------------------------------
-- messages
-- -----------------------------------------------------------------------------
CREATE POLICY "view messages of accessible plans"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.lift_plans p
      WHERE p.id = lift_plan_id
        AND (
          p.client_id = auth.uid()
          OR public.has_role(auth.uid(), 'appointed_person')
          OR public.has_role(auth.uid(), 'admin')
        )
    )
  );

CREATE POLICY "send messages on accessible plans"
  ON public.messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.lift_plans p
      WHERE p.id = lift_plan_id
        AND (
          p.client_id = auth.uid()
          OR public.has_role(auth.uid(), 'appointed_person')
          OR public.has_role(auth.uid(), 'admin')
        )
    )
  );

-- -----------------------------------------------------------------------------
-- lift_plan_writes
-- -----------------------------------------------------------------------------
CREATE POLICY "clients create writes"
  ON public.lift_plan_writes FOR INSERT
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "clients view own writes"
  ON public.lift_plan_writes FOR SELECT
  USING (auth.uid() = client_id);

CREATE POLICY "reviewers view all writes"
  ON public.lift_plan_writes FOR SELECT
  USING (
    public.has_role(auth.uid(), 'appointed_person')
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "reviewers update writes"
  ON public.lift_plan_writes FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'appointed_person')
    OR public.has_role(auth.uid(), 'admin')
  );

-- -----------------------------------------------------------------------------
-- lift_plan_write_files
-- -----------------------------------------------------------------------------
CREATE POLICY "view write files of accessible writes"
  ON public.lift_plan_write_files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.lift_plan_writes w
      WHERE w.id = lift_plan_write_files.lift_plan_write_id
        AND (
          w.client_id = auth.uid()
          OR public.has_role(auth.uid(), 'appointed_person')
          OR public.has_role(auth.uid(), 'admin')
        )
    )
  );

CREATE POLICY "upload write files to accessible writes"
  ON public.lift_plan_write_files FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.lift_plan_writes w
      WHERE w.id = lift_plan_write_files.lift_plan_write_id
        AND (
          w.client_id = auth.uid()
          OR public.has_role(auth.uid(), 'appointed_person')
          OR public.has_role(auth.uid(), 'admin')
        )
    )
  );

-- -----------------------------------------------------------------------------
-- write_messages
-- -----------------------------------------------------------------------------
CREATE POLICY "view write messages of accessible writes"
  ON public.write_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.lift_plan_writes w
      WHERE w.id = write_messages.lift_plan_write_id
        AND (
          w.client_id = auth.uid()
          OR public.has_role(auth.uid(), 'appointed_person')
          OR public.has_role(auth.uid(), 'admin')
        )
    )
  );

CREATE POLICY "send write messages on accessible writes"
  ON public.write_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.lift_plan_writes w
      WHERE w.id = write_messages.lift_plan_write_id
        AND (
          w.client_id = auth.uid()
          OR public.has_role(auth.uid(), 'appointed_person')
          OR public.has_role(auth.uid(), 'admin')
        )
    )
  );

-- -----------------------------------------------------------------------------
-- service_pricing
-- -----------------------------------------------------------------------------
CREATE POLICY "anyone authenticated can view pricing"
  ON public.service_pricing FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "reviewers manage pricing insert"
  ON public.service_pricing FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'appointed_person')
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "reviewers manage pricing update"
  ON public.service_pricing FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'appointed_person')
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "reviewers manage pricing delete"
  ON public.service_pricing FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'appointed_person')
    OR public.has_role(auth.uid(), 'admin')
  );

-- -----------------------------------------------------------------------------
-- email_send_log
-- -----------------------------------------------------------------------------
CREATE POLICY "Service role can read send log"
  ON public.email_send_log FOR SELECT
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role can insert send log"
  ON public.email_send_log FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update send log"
  ON public.email_send_log FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- -----------------------------------------------------------------------------
-- email_send_state
-- -----------------------------------------------------------------------------
CREATE POLICY "Service role can manage send state"
  ON public.email_send_state FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- -----------------------------------------------------------------------------
-- suppressed_emails  (append-only — no UPDATE or DELETE policies)
-- -----------------------------------------------------------------------------
CREATE POLICY "Service role can read suppressed emails"
  ON public.suppressed_emails FOR SELECT
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role can insert suppressed emails"
  ON public.suppressed_emails FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- -----------------------------------------------------------------------------
-- email_unsubscribe_tokens
-- -----------------------------------------------------------------------------
CREATE POLICY "Service role can read tokens"
  ON public.email_unsubscribe_tokens FOR SELECT
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role can insert tokens"
  ON public.email_unsubscribe_tokens FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can mark tokens as used"
  ON public.email_unsubscribe_tokens FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');


-- =============================================================================
-- 7. TRIGGERS  (set_updated_at and handle_new_user both now exist)
-- =============================================================================

CREATE TRIGGER trg_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_lift_plans_updated
  BEFORE UPDATE ON public.lift_plans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_lift_plan_writes
  BEFORE UPDATE ON public.lift_plan_writes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_service_pricing_updated_at
  BEFORE UPDATE ON public.service_pricing
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Fires on every new auth signup to create the profile + assign default role
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- =============================================================================
-- 8. EMAIL QUEUE RPC WRAPPERS  (SECURITY DEFINER; restricted to service_role)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.enqueue_email(queue_name TEXT, payload JSONB)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN pgmq.send(queue_name, payload);
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN pgmq.send(queue_name, payload);
END;
$$;

CREATE OR REPLACE FUNCTION public.read_email_batch(queue_name TEXT, batch_size INT, vt INT)
RETURNS TABLE(msg_id BIGINT, read_ct INT, message JSONB)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
    SELECT r.msg_id, r.read_ct, r.message
    FROM pgmq.read(queue_name, vt, batch_size) r;
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_email(queue_name TEXT, message_id BIGINT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN pgmq.delete(queue_name, message_id);
EXCEPTION WHEN undefined_table THEN
  RETURN FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION public.move_to_dlq(
  source_queue TEXT, dlq_name TEXT, message_id BIGINT, payload JSONB
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_id BIGINT;
BEGIN
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  PERFORM pgmq.delete(source_queue, message_id);
  RETURN new_id;
EXCEPTION WHEN undefined_table THEN
  BEGIN
    PERFORM pgmq.create(dlq_name);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  BEGIN
    PERFORM pgmq.delete(source_queue, message_id);
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;
  RETURN new_id;
END;
$$;

-- Lock queue functions down to service_role only
REVOKE EXECUTE ON FUNCTION public.enqueue_email(TEXT, JSONB)             FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.enqueue_email(TEXT, JSONB)             TO service_role;

REVOKE EXECUTE ON FUNCTION public.read_email_batch(TEXT, INT, INT)       FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.read_email_batch(TEXT, INT, INT)       TO service_role;

REVOKE EXECUTE ON FUNCTION public.delete_email(TEXT, BIGINT)             FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.delete_email(TEXT, BIGINT)             TO service_role;

REVOKE EXECUTE ON FUNCTION public.move_to_dlq(TEXT, TEXT, BIGINT, JSONB) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.move_to_dlq(TEXT, TEXT, BIGINT, JSONB) TO service_role;


-- =============================================================================
-- 9. STORAGE BUCKETS & POLICIES  (has_role() now exists)
-- =============================================================================

-- lift-plan-files (private — review requests)
INSERT INTO storage.buckets (id, name, public)
VALUES ('lift-plan-files', 'lift-plan-files', false);

CREATE POLICY "users view own bucket files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'lift-plan-files'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR public.has_role(auth.uid(), 'appointed_person')
      OR public.has_role(auth.uid(), 'admin')
    )
  );

CREATE POLICY "users upload own bucket files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'lift-plan-files'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "reviewers upload review docs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'lift-plan-files'
    AND (
      public.has_role(auth.uid(), 'appointed_person')
      OR public.has_role(auth.uid(), 'admin')
    )
  );

-- lift-plan-write-files (private — write requests)
INSERT INTO storage.buckets (id, name, public)
VALUES ('lift-plan-write-files', 'lift-plan-write-files', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "view write files in storage"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'lift-plan-write-files'
    AND EXISTS (
      SELECT 1
      FROM public.lift_plan_write_files f
      JOIN public.lift_plan_writes w ON w.id = f.lift_plan_write_id
      WHERE f.file_path = storage.objects.name
        AND (
          w.client_id = auth.uid()
          OR public.has_role(auth.uid(), 'appointed_person')
          OR public.has_role(auth.uid(), 'admin')
        )
    )
  );

CREATE POLICY "upload write files in storage"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'lift-plan-write-files'
    AND auth.uid() IS NOT NULL
  );


-- =============================================================================
-- 10. REALTIME PUBLICATIONS
-- =============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.write_messages;


-- =============================================================================
-- 11. EMAIL QUEUES  (pgmq extension now active)
-- =============================================================================

DO $$ BEGIN PERFORM pgmq.create('auth_emails');              EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM pgmq.create('transactional_emails');     EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM pgmq.create('auth_emails_dlq');          EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM pgmq.create('transactional_emails_dlq'); EXCEPTION WHEN OTHERS THEN NULL; END $$;


-- =============================================================================
-- 12. SEED DATA
-- =============================================================================

-- email_send_state singleton row
INSERT INTO public.email_send_state (id) VALUES (1) ON CONFLICT DO NOTHING;

-- service_pricing: £0 placeholder for every service × equipment_type combination
INSERT INTO public.service_pricing (service, equipment_type, price)
SELECT s.service, e.equipment_type, 0
FROM
  (VALUES ('review'::public.service_kind), ('write'::public.service_kind)) AS s(service)
CROSS JOIN (
  SELECT unnest(enum_range(NULL::public.equipment_type)) AS equipment_type
) AS e
ON CONFLICT DO NOTHING;
