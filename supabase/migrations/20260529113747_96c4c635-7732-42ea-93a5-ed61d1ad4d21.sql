-- Ensure deleted courses/programs remove their dependent enrolled_courses rows
ALTER TABLE public.enrolled_courses
  DROP CONSTRAINT IF EXISTS enrolled_courses_course_id_fkey;

ALTER TABLE public.enrolled_courses
  ADD CONSTRAINT enrolled_courses_course_id_fkey
  FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;

-- Clean up any existing orphaned enrolled_courses rows (course no longer exists)
DELETE FROM public.enrolled_courses
WHERE course_id NOT IN (SELECT id FROM public.courses);