
-- 1. Tighten instructor SELECT policy on assignment-submissions storage
DROP POLICY IF EXISTS "Instructors can view assignment files for their courses" ON storage.objects;
CREATE POLICY "Instructors can view assignment files for their courses"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'assignment-submissions'
  AND EXISTS (
    SELECT 1
    FROM public.assignment_submissions s
    JOIN public.course_assignments ca ON ca.id = s.assignment_id
    JOIN public.courses c ON c.id = ca.course_id
    WHERE c.instructor_id = auth.uid()
      AND (
        (storage.objects.name = ANY (COALESCE(s.file_urls, ARRAY[]::text[])))
        OR ((s.student_id)::text = (storage.foldername(storage.objects.name))[1])
      )
  )
);

-- 2. Tighten course-content storage SELECT: additionally require a matching course_content row
DROP POLICY IF EXISTS "Enrolled users can view course content" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view course content files" ON storage.objects;
CREATE POLICY "Enrolled users can view course content"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'course-content'
  AND EXISTS (
    SELECT 1 FROM public.course_content cc
    WHERE (cc.file_path = storage.objects.name OR cc.content_url LIKE '%' || storage.objects.name)
      AND (
        public.has_role(auth.uid(), 'admin'::app_role)
        OR EXISTS (
          SELECT 1 FROM public.courses c
          WHERE c.id = cc.course_id AND c.instructor_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM public.enrollments e
          WHERE e.course_id = cc.course_id
            AND e.user_id = auth.uid()
            AND e.access_status = 'active'
            AND e.payment_status = ANY (ARRAY['paid','partial'])
        )
      )
  )
);

-- 3. Restrict CV uploads to a controlled prefix
DROP POLICY IF EXISTS "Anyone can upload CVs to cv-uploads" ON storage.objects;
CREATE POLICY "Applicants can upload CVs to applications folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'cv-uploads'
  AND (storage.foldername(name))[1] = 'applications'
  AND octet_length(name) < 512
);

-- 4. Replace permissive job_applications INSERT policy with validation
DROP POLICY IF EXISTS "Anyone can submit applications" ON public.job_applications;
CREATE POLICY "Anyone can submit applications"
ON public.job_applications FOR INSERT
WITH CHECK (
  applicant_name IS NOT NULL AND length(trim(applicant_name)) BETWEEN 1 AND 200
  AND applicant_email IS NOT NULL AND length(trim(applicant_email)) BETWEEN 3 AND 320
  AND applicant_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
);

-- 5. Prevent public listing on public buckets (public URLs still work; RLS only affects listing)
DROP POLICY IF EXISTS "Anyone can view course images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view program images" ON storage.objects;
-- assignment-submissions bucket: no broad public SELECT policy needed; existing granular policies remain.

-- 6. Set search_path on email queue helper functions
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pgmq;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pgmq;
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pgmq;

-- 7. Revoke EXECUTE on SECURITY DEFINER internal helpers from anon/authenticated
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.email_queue_wake() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.email_queue_dispatch() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
-- has_role is used by RLS policies from authenticated context; keep executable
-- increment_students_count is called from the client after enrollment; keep executable by authenticated only
REVOKE EXECUTE ON FUNCTION public.increment_students_count(uuid) FROM PUBLIC, anon;
