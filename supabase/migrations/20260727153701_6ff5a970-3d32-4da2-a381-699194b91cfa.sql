ALTER TABLE public.program_applications ADD COLUMN IF NOT EXISTS guardian_gender text;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.program_applications TO authenticated;
GRANT ALL ON public.program_applications TO service_role;