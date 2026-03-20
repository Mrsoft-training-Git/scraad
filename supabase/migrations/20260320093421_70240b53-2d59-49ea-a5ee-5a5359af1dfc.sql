
-- Add track column to cbt_exams
ALTER TABLE public.cbt_exams ADD COLUMN track text DEFAULT NULL;

-- Update student RLS policy to also check track matching
DROP POLICY IF EXISTS "Students can view published exams for enrolled courses" ON public.cbt_exams;

CREATE POLICY "Students can view published exams for enrolled courses"
ON public.cbt_exams
FOR SELECT
USING (
  (is_published = true) AND (
    (
      (exam_type = 'course') AND EXISTS (
        SELECT 1 FROM enrollments e
        WHERE e.course_id = cbt_exams.course_id
          AND e.user_id = auth.uid()
          AND e.access_status = 'active'
          AND e.payment_status IN ('paid', 'partial')
      )
    )
    OR
    (
      (exam_type = 'program') AND EXISTS (
        SELECT 1 FROM program_enrollments pe
        JOIN programs p ON p.id = pe.program_id
        WHERE pe.program_id = cbt_exams.program_id
          AND pe.user_id = auth.uid()
          AND (cbt_exams.track IS NULL OR p.track = cbt_exams.track)
      )
    )
  )
);
