
-- Superadmin może dodawać nowe organizacje
CREATE POLICY "Superadmin insert org" ON public.organizacje FOR INSERT TO authenticated
  WITH CHECK (public.is_superadmin(auth.uid()));
