-- New status enum for write requests (includes draft_delivered)
CREATE TYPE public.lift_plan_write_status AS ENUM (
  'submitted',
  'assigned',
  'request_info',
  'draft_delivered',
  'completed'
);

-- Main table for "Write a Lift Plan" requests
CREATE TABLE public.lift_plan_writes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  assigned_to uuid,
  reference text NOT NULL,
  equipment_type public.equipment_type NOT NULL,
  timeframe public.timeframe_type NOT NULL,
  payment_type public.payment_type NOT NULL,
  payment_status public.payment_status NOT NULL DEFAULT 'pending',
  po_number text,
  price numeric,
  details text NOT NULL,
  status public.lift_plan_write_status NOT NULL DEFAULT 'submitted',
  assigned_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lift_plan_writes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clients create writes"
  ON public.lift_plan_writes FOR INSERT
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "clients view own writes"
  ON public.lift_plan_writes FOR SELECT
  USING (auth.uid() = client_id);

CREATE POLICY "reviewers view all writes"
  ON public.lift_plan_writes FOR SELECT
  USING (has_role(auth.uid(), 'appointed_person'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "reviewers update writes"
  ON public.lift_plan_writes FOR UPDATE
  USING (has_role(auth.uid(), 'appointed_person'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER set_updated_at_lift_plan_writes
  BEFORE UPDATE ON public.lift_plan_writes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Files attached to write requests (client uploads + AP delivered drafts)
CREATE TABLE public.lift_plan_write_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lift_plan_write_id uuid NOT NULL REFERENCES public.lift_plan_writes(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint,
  mime_type text,
  is_deliverable boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lift_plan_write_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view write files of accessible writes"
  ON public.lift_plan_write_files FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.lift_plan_writes w
    WHERE w.id = lift_plan_write_files.lift_plan_write_id
      AND (w.client_id = auth.uid()
           OR has_role(auth.uid(), 'appointed_person'::app_role)
           OR has_role(auth.uid(), 'admin'::app_role))
  ));

CREATE POLICY "upload write files to accessible writes"
  ON public.lift_plan_write_files FOR INSERT
  WITH CHECK (uploaded_by = auth.uid() AND EXISTS (
    SELECT 1 FROM public.lift_plan_writes w
    WHERE w.id = lift_plan_write_files.lift_plan_write_id
      AND (w.client_id = auth.uid()
           OR has_role(auth.uid(), 'appointed_person'::app_role)
           OR has_role(auth.uid(), 'admin'::app_role))
  ));

-- Messages for chat on write requests
CREATE TABLE public.write_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lift_plan_write_id uuid NOT NULL REFERENCES public.lift_plan_writes(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.write_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view write messages of accessible writes"
  ON public.write_messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.lift_plan_writes w
    WHERE w.id = write_messages.lift_plan_write_id
      AND (w.client_id = auth.uid()
           OR has_role(auth.uid(), 'appointed_person'::app_role)
           OR has_role(auth.uid(), 'admin'::app_role))
  ));

CREATE POLICY "send write messages on accessible writes"
  ON public.write_messages FOR INSERT
  WITH CHECK (sender_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.lift_plan_writes w
    WHERE w.id = write_messages.lift_plan_write_id
      AND (w.client_id = auth.uid()
           OR has_role(auth.uid(), 'appointed_person'::app_role)
           OR has_role(auth.uid(), 'admin'::app_role))
  ));

ALTER TABLE public.write_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.write_messages;

-- Storage bucket for write files
INSERT INTO storage.buckets (id, name, public)
VALUES ('lift-plan-write-files', 'lift-plan-write-files', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "view write files in storage"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'lift-plan-write-files'
    AND EXISTS (
      SELECT 1 FROM public.lift_plan_write_files f
      JOIN public.lift_plan_writes w ON w.id = f.lift_plan_write_id
      WHERE f.file_path = storage.objects.name
        AND (w.client_id = auth.uid()
             OR has_role(auth.uid(), 'appointed_person'::app_role)
             OR has_role(auth.uid(), 'admin'::app_role))
    )
  );

CREATE POLICY "upload write files in storage"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'lift-plan-write-files'
    AND auth.uid() IS NOT NULL
  );