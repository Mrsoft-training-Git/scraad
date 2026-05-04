ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS intro_video_url text;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS intro_video_url text;