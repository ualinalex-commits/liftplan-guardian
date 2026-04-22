
-- 1. Add due_date columns
ALTER TABLE public.lift_plans ADD COLUMN IF NOT EXISTS due_date timestamptz;
ALTER TABLE public.lift_plan_writes ADD COLUMN IF NOT EXISTS due_date timestamptz;

-- 2. Create service_pricing table
CREATE TYPE public.service_kind AS ENUM ('review', 'write');

CREATE TABLE public.service_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service public.service_kind NOT NULL,
  equipment_type public.equipment_type NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (service, equipment_type)
);

ALTER TABLE public.service_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone authenticated can view pricing"
ON public.service_pricing FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "reviewers manage pricing insert"
ON public.service_pricing FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'appointed_person') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "reviewers manage pricing update"
ON public.service_pricing FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'appointed_person') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "reviewers manage pricing delete"
ON public.service_pricing FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'appointed_person') OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER set_service_pricing_updated_at
BEFORE UPDATE ON public.service_pricing
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. Seed defaults (price 0) for every combination
INSERT INTO public.service_pricing (service, equipment_type, price)
SELECT s.service, e.equipment_type, 0
FROM (VALUES ('review'::public.service_kind), ('write'::public.service_kind)) AS s(service)
CROSS JOIN (
  SELECT unnest(enum_range(NULL::public.equipment_type)) AS equipment_type
) AS e
ON CONFLICT DO NOTHING;
