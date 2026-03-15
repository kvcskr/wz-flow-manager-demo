
-- Allow admins to update their own org (for ustawienia page)
CREATE POLICY "Admin update own org" ON public.organizacje FOR UPDATE TO authenticated
  USING (id = public.get_user_org_id(auth.uid()) AND public.get_user_role(auth.uid()) = 'admin')
  WITH CHECK (id = public.get_user_org_id(auth.uid()) AND public.get_user_role(auth.uid()) = 'admin');
