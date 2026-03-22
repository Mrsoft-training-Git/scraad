
-- Fix empty string tracks to NULL
UPDATE cbt_exams SET track = NULL WHERE track = '';

-- Drop and recreate the student RLS policy to handle empty string track
DROP POLICY IF EXISTS "Students can view published exams for enrolled courses" ON cbt_exams;

CREATE POLICY "Students can view published exams for enrolled courses"
ON cbt_exams
FOR SELECT
TO public
USING (
  is_published = true
  AND (
    (
      exam_type = 'course'
      AND EXISTS (
        SELECT 1 FROM enrollments e
        WHERE e.course_id = cbt_exams.course_id
          AND e.user_id = auth.uid()
          AND e.payment_status IN ('paid', 'partial')
      )
    )
    OR
    (
      exam_type = 'program'
      AND EXISTS (
        SELECT 1 FROM program_enrollments pe
        JOIN programs p ON p.id = pe.program_id
        WHERE pe.program_id = cbt_exams.program_id
          AND pe.user_id = auth.uid()
          AND (cbt_exams.track IS NULL OR cbt_exams.track = '' OR p.track = cbt_exams.track)
      )
    )
  )
);
