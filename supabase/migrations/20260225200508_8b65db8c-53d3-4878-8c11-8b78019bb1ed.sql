
-- Organizacje (tenants)
CREATE TABLE public.organizacje (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nazwa text NOT NULL,
  nip text,
  email_kontaktowy text,
  nazwa_na_wz text NOT NULL DEFAULT '',
  nip_na_wz text NOT NULL DEFAULT '',
  subscription_status text NOT NULL DEFAULT 'trial'
    CHECK (subscription_status IN ('trial', 'active', 'inactive')),
  subscription_expires_at date,
  utworzono timestamptz DEFAULT now()
);

-- Powiązanie użytkownik ↔ organizacja + rola
CREATE TABLE public.uzytkownicy_organizacji (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.organizacje(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rola text NOT NULL CHECK (rola IN ('superadmin', 'admin', 'kierowca')),
  utworzono timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Katalog produktów per organizacja
CREATE TABLE public.produkty (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.organizacje(id) ON DELETE CASCADE NOT NULL,
  nazwa text NOT NULL,
  jednostka text NOT NULL DEFAULT 'szt.',
  aktywny boolean DEFAULT true,
  kolejnosc integer DEFAULT 0,
  utworzono timestamptz DEFAULT now()
);

-- Klienci (odbiorcy towarów) per organizacja
CREATE TABLE public.klienci (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.organizacje(id) ON DELETE CASCADE NOT NULL,
  nazwa text NOT NULL,
  nip text,
  aktywny boolean DEFAULT true,
  utworzono timestamptz DEFAULT now()
);

-- Indywidualne ceny: klient × produkt
CREATE TABLE public.ceny_klientow (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  klient_id uuid REFERENCES public.klienci(id) ON DELETE CASCADE NOT NULL,
  produkt_id uuid REFERENCES public.produkty(id) ON DELETE CASCADE NOT NULL,
  cena_jednostkowa decimal(10,2) NOT NULL DEFAULT 0.00,
  UNIQUE(klient_id, produkt_id)
);

-- Dokumenty WZ
CREATE TABLE public.dokumenty_wz (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.organizacje(id) ON DELETE CASCADE NOT NULL,
  klient_id uuid REFERENCES public.klienci(id),
  data date NOT NULL DEFAULT current_date,
  wystawil uuid REFERENCES auth.users(id),
  utworzono timestamptz DEFAULT now()
);

-- Pozycje dokumentu WZ
CREATE TABLE public.pozycje_wz (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wz_id uuid REFERENCES public.dokumenty_wz(id) ON DELETE CASCADE NOT NULL,
  produkt_id uuid REFERENCES public.produkty(id),
  wydano integer NOT NULL DEFAULT 0,
  zwrocono integer NOT NULL DEFAULT 0,
  cena_snapshot decimal(10,2) DEFAULT 0.00
);

-- Enable RLS
ALTER TABLE public.organizacje ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uzytkownicy_organizacji ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produkty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.klienci ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ceny_klientow ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dokumenty_wz ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pozycje_wz ENABLE ROW LEVEL SECURITY;

-- Helper: get user org_id (security definer to avoid recursion)
CREATE OR REPLACE FUNCTION public.get_user_org_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT org_id FROM public.uzytkownicy_organizacji WHERE user_id = _user_id LIMIT 1;
$$;

-- Helper: get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT rola FROM public.uzytkownicy_organizacji WHERE user_id = _user_id LIMIT 1;
$$;

-- Helper: is superadmin
CREATE OR REPLACE FUNCTION public.is_superadmin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.uzytkownicy_organizacji WHERE user_id = _user_id AND rola = 'superadmin'
  );
$$;

-- RLS: organizacje
CREATE POLICY "Users see own org" ON public.organizacje FOR SELECT TO authenticated
  USING (id = public.get_user_org_id(auth.uid()) OR public.is_superadmin(auth.uid()));
CREATE POLICY "Superadmin update org" ON public.organizacje FOR UPDATE TO authenticated
  USING (public.is_superadmin(auth.uid()));

-- RLS: uzytkownicy_organizacji
CREATE POLICY "Users see own org members" ON public.uzytkownicy_organizacji FOR SELECT TO authenticated
  USING (org_id = public.get_user_org_id(auth.uid()) OR public.is_superadmin(auth.uid()));
CREATE POLICY "Admin insert org members" ON public.uzytkownicy_organizacji FOR INSERT TO authenticated
  WITH CHECK (
    org_id = public.get_user_org_id(auth.uid()) AND public.get_user_role(auth.uid()) = 'admin'
  );
CREATE POLICY "Admin delete org members" ON public.uzytkownicy_organizacji FOR DELETE TO authenticated
  USING (org_id = public.get_user_org_id(auth.uid()) AND public.get_user_role(auth.uid()) = 'admin');

-- RLS: produkty
CREATE POLICY "Users see own org products" ON public.produkty FOR SELECT TO authenticated
  USING (org_id = public.get_user_org_id(auth.uid()));
CREATE POLICY "Admin manage products" ON public.produkty FOR ALL TO authenticated
  USING (org_id = public.get_user_org_id(auth.uid()) AND public.get_user_role(auth.uid()) = 'admin')
  WITH CHECK (org_id = public.get_user_org_id(auth.uid()) AND public.get_user_role(auth.uid()) = 'admin');

-- RLS: klienci
CREATE POLICY "Users see own org clients" ON public.klienci FOR SELECT TO authenticated
  USING (org_id = public.get_user_org_id(auth.uid()));
CREATE POLICY "Admin manage clients" ON public.klienci FOR ALL TO authenticated
  USING (org_id = public.get_user_org_id(auth.uid()) AND public.get_user_role(auth.uid()) = 'admin')
  WITH CHECK (org_id = public.get_user_org_id(auth.uid()) AND public.get_user_role(auth.uid()) = 'admin');

-- RLS: ceny_klientow
CREATE POLICY "Users see own org prices" ON public.ceny_klientow FOR SELECT TO authenticated
  USING (
    klient_id IN (SELECT id FROM public.klienci WHERE org_id = public.get_user_org_id(auth.uid()))
  );
CREATE POLICY "Admin manage prices" ON public.ceny_klientow FOR ALL TO authenticated
  USING (
    klient_id IN (SELECT id FROM public.klienci WHERE org_id = public.get_user_org_id(auth.uid()))
    AND public.get_user_role(auth.uid()) = 'admin'
  )
  WITH CHECK (
    klient_id IN (SELECT id FROM public.klienci WHERE org_id = public.get_user_org_id(auth.uid()))
    AND public.get_user_role(auth.uid()) = 'admin'
  );

-- RLS: dokumenty_wz
CREATE POLICY "Users see own org wz" ON public.dokumenty_wz FOR SELECT TO authenticated
  USING (org_id = public.get_user_org_id(auth.uid()));
CREATE POLICY "Users insert own org wz" ON public.dokumenty_wz FOR INSERT TO authenticated
  WITH CHECK (org_id = public.get_user_org_id(auth.uid()));
CREATE POLICY "Admin delete wz" ON public.dokumenty_wz FOR DELETE TO authenticated
  USING (org_id = public.get_user_org_id(auth.uid()) AND public.get_user_role(auth.uid()) = 'admin');

-- RLS: pozycje_wz
CREATE POLICY "Users see own org wz items" ON public.pozycje_wz FOR SELECT TO authenticated
  USING (
    wz_id IN (SELECT id FROM public.dokumenty_wz WHERE org_id = public.get_user_org_id(auth.uid()))
  );
CREATE POLICY "Users insert wz items" ON public.pozycje_wz FOR INSERT TO authenticated
  WITH CHECK (
    wz_id IN (SELECT id FROM public.dokumenty_wz WHERE org_id = public.get_user_org_id(auth.uid()))
  );
CREATE POLICY "Admin delete wz items" ON public.pozycje_wz FOR DELETE TO authenticated
  USING (
    wz_id IN (SELECT id FROM public.dokumenty_wz WHERE org_id = public.get_user_org_id(auth.uid()))
    AND public.get_user_role(auth.uid()) = 'admin'
  );
