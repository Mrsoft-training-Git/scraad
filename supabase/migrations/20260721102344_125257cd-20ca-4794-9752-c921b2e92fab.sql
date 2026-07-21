
CREATE TABLE public.popup_ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  link_url text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.popup_ads TO anon, authenticated;
GRANT ALL ON public.popup_ads TO service_role, authenticated;
ALTER TABLE public.popup_ads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active popup ads" ON public.popup_ads FOR SELECT USING (active OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage popup ads" ON public.popup_ads FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
