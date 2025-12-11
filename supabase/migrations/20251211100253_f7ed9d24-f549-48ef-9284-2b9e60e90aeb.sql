-- Add watch_progress column to content_progress table to track partial completion
ALTER TABLE public.content_progress 
ADD COLUMN IF NOT EXISTS watch_progress integer DEFAULT 0;

-- Add comment for clarity
COMMENT ON COLUMN public.content_progress.watch_progress IS 'Percentage of content consumed (0-100). For videos, tracks how much has been watched.';

-- Update the unique constraint to allow upserts
ALTER TABLE public.content_progress 
DROP CONSTRAINT IF EXISTS content_progress_user_content_unique;

ALTER TABLE public.content_progress 
ADD CONSTRAINT content_progress_user_content_unique UNIQUE (user_id, content_id);

-- Add policy for UPDATE if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'content_progress' 
    AND policyname = 'Users can update their own progress'
  ) THEN
    CREATE POLICY "Users can update their own progress"
    ON public.content_progress
    FOR UPDATE
    USING (auth.uid() = user_id);
  END IF;
END $$;