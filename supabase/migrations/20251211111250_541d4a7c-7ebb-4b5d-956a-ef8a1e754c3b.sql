-- Re-add instructor update policy
CREATE POLICY "Instructors can update their assigned courses"
ON public.courses
FOR UPDATE
USING (instructor_id = auth.uid());