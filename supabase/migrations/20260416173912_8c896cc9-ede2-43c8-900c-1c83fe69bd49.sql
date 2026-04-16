
-- Enums
CREATE TYPE public.app_role AS ENUM ('client', 'appointed_person', 'admin');
CREATE TYPE public.lift_plan_status AS ENUM ('submitted', 'assigned', 'in_review', 'request_info', 'rejected', 'completed');
CREATE TYPE public.equipment_type AS ENUM ('tower_crane', 'mobile_crane', 'digger', 'forklift', 'hiab', 'mewp');
CREATE TYPE public.timeframe_type AS ENUM ('24h', '48h', '72h');
CREATE TYPE public.payment_type AS ENUM ('po', 'direct');
CREATE TYPE public.payment_status AS ENUM ('pending', 'paid', 'po_recorded');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Lift plans
CREATE TABLE public.lift_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reference TEXT NOT NULL,
  description TEXT,
  status lift_plan_status NOT NULL DEFAULT 'submitted',
  equipment_type equipment_type NOT NULL,
  timeframe timeframe_type NOT NULL,
  payment_type payment_type NOT NULL,
  payment_status payment_status NOT NULL DEFAULT 'pending',
  po_number TEXT,
  price NUMERIC(10,2),
  assigned_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.lift_plans ENABLE ROW LEVEL SECURITY;

-- Lift plan files (uploaded by client + final review docs)
CREATE TABLE public.lift_plan_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lift_plan_id UUID NOT NULL REFERENCES public.lift_plans(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  is_review_document BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.lift_plan_files ENABLE ROW LEVEL SECURITY;

-- Status history
CREATE TABLE public.status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lift_plan_id UUID NOT NULL REFERENCES public.lift_plans(id) ON DELETE CASCADE,
  changed_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_status lift_plan_status,
  to_status lift_plan_status NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.status_history ENABLE ROW LEVEL SECURITY;

-- Messages (request info / replies)
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lift_plan_id UUID NOT NULL REFERENCES public.lift_plans(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_lift_plans_updated BEFORE UPDATE ON public.lift_plans FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto profile + default client role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies
-- profiles
CREATE POLICY "users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "reviewers view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'appointed_person') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- user_roles
CREATE POLICY "users view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "admins view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- lift_plans
CREATE POLICY "clients view own plans" ON public.lift_plans FOR SELECT USING (auth.uid() = client_id);
CREATE POLICY "reviewers view all plans" ON public.lift_plans FOR SELECT USING (public.has_role(auth.uid(), 'appointed_person') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "clients create plans" ON public.lift_plans FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "reviewers update plans" ON public.lift_plans FOR UPDATE USING (public.has_role(auth.uid(), 'appointed_person') OR public.has_role(auth.uid(), 'admin'));

-- lift_plan_files
CREATE POLICY "view files of accessible plans" ON public.lift_plan_files FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.lift_plans p WHERE p.id = lift_plan_id AND (p.client_id = auth.uid() OR public.has_role(auth.uid(), 'appointed_person') OR public.has_role(auth.uid(), 'admin')))
);
CREATE POLICY "upload files to accessible plans" ON public.lift_plan_files FOR INSERT WITH CHECK (
  uploaded_by = auth.uid() AND EXISTS (SELECT 1 FROM public.lift_plans p WHERE p.id = lift_plan_id AND (p.client_id = auth.uid() OR public.has_role(auth.uid(), 'appointed_person') OR public.has_role(auth.uid(), 'admin')))
);

-- status_history
CREATE POLICY "view history of accessible plans" ON public.status_history FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.lift_plans p WHERE p.id = lift_plan_id AND (p.client_id = auth.uid() OR public.has_role(auth.uid(), 'appointed_person') OR public.has_role(auth.uid(), 'admin')))
);
CREATE POLICY "reviewers add history" ON public.status_history FOR INSERT WITH CHECK (
  changed_by = auth.uid() AND (public.has_role(auth.uid(), 'appointed_person') OR public.has_role(auth.uid(), 'admin'))
);

-- messages
CREATE POLICY "view messages of accessible plans" ON public.messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.lift_plans p WHERE p.id = lift_plan_id AND (p.client_id = auth.uid() OR public.has_role(auth.uid(), 'appointed_person') OR public.has_role(auth.uid(), 'admin')))
);
CREATE POLICY "send messages on accessible plans" ON public.messages FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND EXISTS (SELECT 1 FROM public.lift_plans p WHERE p.id = lift_plan_id AND (p.client_id = auth.uid() OR public.has_role(auth.uid(), 'appointed_person') OR public.has_role(auth.uid(), 'admin')))
);

-- Storage bucket for lift plan files (private)
INSERT INTO storage.buckets (id, name, public) VALUES ('lift-plan-files', 'lift-plan-files', false);

CREATE POLICY "users view own bucket files" ON storage.objects FOR SELECT USING (
  bucket_id = 'lift-plan-files' AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(), 'appointed_person')
    OR public.has_role(auth.uid(), 'admin')
  )
);
CREATE POLICY "users upload own bucket files" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'lift-plan-files' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "reviewers upload review docs" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'lift-plan-files' AND (public.has_role(auth.uid(), 'appointed_person') OR public.has_role(auth.uid(), 'admin'))
);
