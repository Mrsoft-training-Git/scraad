
-- Make course-content bucket private
UPDATE storage.buckets SET public = false WHERE id = 'course-content';

-- Drop existing public SELECT policy if any
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view course content" ON storage.objects;
DROP POLICY IF EXISTS "Public can view course content" ON storage.objects;

-- Create policy: only enrolled users (with active access) can view course content files
CREATE POLICY "Enrolled users can view course content"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'course-content' AND (
    -- Admins can access all
    has_role(auth.uid(), 'admin'::app_role)
    OR
    -- Instructors can access their course content (folder name = course_id)
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id::text = (storage.foldername(name))[1]
      AND c.instructor_id = auth.uid()
    )
    OR
    -- Enrolled students with active access
    EXISTS (
      SELECT 1 FROM enrollments e
      WHERE e.course_id::text = (storage.foldername(name))[1]
      AND e.user_id = auth.uid()
      AND e.access_status = 'active'
      AND e.payment_status IN ('paid', 'partial')
    )
  )
);
