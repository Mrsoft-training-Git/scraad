-- Add 'instructor' to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'instructor';

-- Add instructor_id column to courses table to track which instructor owns/is assigned to a course
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS instructor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_courses_instructor_id ON public.courses(instructor_id);

-- RLS policy: Instructors can view their assigned courses
CREATE POLICY "Instructors can view their assigned courses"
ON public.courses
FOR SELECT
USING (instructor_id = auth.uid());

-- RLS policy: Instructors can update their assigned courses
CREATE POLICY "Instructors can update their assigned courses"
ON public.courses
FOR UPDATE
USING (instructor_id = auth.uid());

-- RLS policy: Instructors can manage content for their courses
CREATE POLICY "Instructors can manage content for their courses"
ON public.course_content
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.courses
    WHERE courses.id = course_content.course_id
    AND courses.instructor_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.courses
    WHERE courses.id = course_content.course_id
    AND courses.instructor_id = auth.uid()
  )
);

-- RLS policy: Instructors can manage modules for their courses
CREATE POLICY "Instructors can manage modules for their courses"
ON public.course_modules
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.courses
    WHERE courses.id = course_modules.course_id
    AND courses.instructor_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.courses
    WHERE courses.id = course_modules.course_id
    AND courses.instructor_id = auth.uid()
  )
);

-- RLS policy: Instructors can view enrollments for their courses
CREATE POLICY "Instructors can view enrollments for their courses"
ON public.enrolled_courses
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.courses
    WHERE courses.id = enrolled_courses.course_id
    AND courses.instructor_id = auth.uid()
  )
);