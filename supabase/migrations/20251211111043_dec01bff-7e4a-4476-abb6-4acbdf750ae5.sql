-- Allow instructors to view profiles of students enrolled in their courses
CREATE POLICY "Instructors can view profiles of their students"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM public.enrolled_courses ec
    JOIN public.courses c ON ec.course_id = c.id
    WHERE ec.user_id = profiles.id
    AND c.instructor_id = auth.uid()
  )
);