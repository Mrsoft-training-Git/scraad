-- Add pending_review column to courses table
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS pending_review boolean DEFAULT false;

-- Add index for efficient querying
CREATE INDEX IF NOT EXISTS idx_courses_pending_review ON public.courses(pending_review);