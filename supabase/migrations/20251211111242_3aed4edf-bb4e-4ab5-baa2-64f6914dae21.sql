-- Allow instructors to insert courses (they will be auto-assigned as instructor)
CREATE POLICY "Instructors can insert courses"
ON public.courses
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'instructor'::app_role) 
  AND instructor_id = auth.uid()
);

-- Drop existing instructor update policy and recreate with restriction on published field
DROP POLICY IF EXISTS "Instructors can update their assigned courses" ON public.courses;

-- Instructors can update their courses but NOT the published, featured, or top_rated fields
-- We'll handle this restriction in application code since Postgres doesn't support column-level RLS