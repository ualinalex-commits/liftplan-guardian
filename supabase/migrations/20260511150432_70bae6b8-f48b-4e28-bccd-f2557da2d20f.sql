
-- Create trigger to auto-create profile + role on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill missing profiles
INSERT INTO public.profiles (id, full_name, email, company)
SELECT u.id,
       COALESCE(u.raw_user_meta_data->>'full_name', ''),
       u.email,
       COALESCE(u.raw_user_meta_data->>'company', '')
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- Backfill missing default client roles
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'client'::app_role
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = u.id);
