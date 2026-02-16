
-- Fix 1: Make cv-uploads bucket private and fix policies
UPDATE storage.buckets SET public = false WHERE id = 'cv-uploads';

DROP POLICY IF EXISTS "Anyone can upload CVs" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view CVs" ON storage.objects;

-- Allow anyone (even unauthenticated for job applications) to upload CVs
CREATE POLICY "Anyone can upload CVs to cv-uploads"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'cv-uploads');

-- Only admins can view/download CVs
CREATE POLICY "Admins can view CVs"
ON storage.objects FOR SELECT
USING (bucket_id = 'cv-uploads' AND has_role(auth.uid(), 'admin'::app_role));

-- Fix 2: Update course_content RLS to check access_status
DROP POLICY IF EXISTS "Students can view published content for enrolled courses" ON public.course_content;

CREATE POLICY "Students can view published content for enrolled courses"
ON public.course_content
FOR SELECT
USING (
  is_published = true 
  AND EXISTS (
    SELECT 1 FROM public.enrollments e
    WHERE e.course_id = course_content.course_id 
    AND e.user_id = auth.uid()
    AND e.access_status = 'active'
    AND e.payment_status IN ('paid', 'partial')
  )
);

-- Fix related policies: live_sessions
DROP POLICY IF EXISTS "Students can view sessions for enrolled courses" ON public.live_sessions;

CREATE POLICY "Students can view sessions for enrolled courses"
ON public.live_sessions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.enrollments e
    WHERE e.course_id = live_sessions.course_id 
    AND e.user_id = auth.uid()
    AND e.access_status = 'active'
    AND e.payment_status IN ('paid', 'partial')
  )
);

-- Fix: course_announcements
DROP POLICY IF EXISTS "Students can view announcements for enrolled courses" ON public.course_announcements;

CREATE POLICY "Students can view announcements for enrolled courses"
ON public.course_announcements
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.enrollments e
    WHERE e.course_id = course_announcements.course_id 
    AND e.user_id = auth.uid()
    AND e.access_status = 'active'
    AND e.payment_status IN ('paid', 'partial')
  )
);

-- Fix: discussion_threads
DROP POLICY IF EXISTS "Students can view discussion threads" ON public.discussion_threads;

CREATE POLICY "Students can view discussion threads"
ON public.discussion_threads
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.enrollments e
    WHERE e.course_id = discussion_threads.course_id 
    AND e.user_id = auth.uid()
    AND e.access_status = 'active'
    AND e.payment_status IN ('paid', 'partial')
  )
);

-- Fix: course_assignments
DROP POLICY IF EXISTS "Students can view published assignments" ON public.course_assignments;

CREATE POLICY "Students can view published assignments"
ON public.course_assignments
FOR SELECT
USING (
  is_published = true 
  AND EXISTS (
    SELECT 1 FROM public.enrollments e
    WHERE e.course_id = course_assignments.course_id 
    AND e.user_id = auth.uid()
    AND e.access_status = 'active'
    AND e.payment_status IN ('paid', 'partial')
  )
);

-- Fix: knowledge_check_questions
DROP POLICY IF EXISTS "Students can view knowledge check questions for enrolled course" ON public.knowledge_check_questions;

CREATE POLICY "Students can view knowledge check questions for enrolled course"
ON public.knowledge_check_questions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.course_content cc
    JOIN public.enrollments e ON e.course_id = cc.course_id
    WHERE cc.id = knowledge_check_questions.content_id 
    AND cc.is_published = true 
    AND e.user_id = auth.uid()
    AND e.access_status = 'active'
    AND e.payment_status IN ('paid', 'partial')
  )
);

-- Fix: course_modules
DROP POLICY IF EXISTS "Students can view modules for enrolled courses" ON public.course_modules;

CREATE POLICY "Students can view modules for enrolled courses"
ON public.course_modules
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.enrollments e
    WHERE e.course_id = course_modules.course_id 
    AND e.user_id = auth.uid()
    AND e.access_status = 'active'
    AND e.payment_status IN ('paid', 'partial')
  )
);

-- Fix related insert policies that use enrolled_courses for access checks
-- discussion_threads INSERT
DROP POLICY IF EXISTS "Students can create discussion threads" ON public.discussion_threads;

CREATE POLICY "Students can create discussion threads"
ON public.discussion_threads
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.enrollments e
    WHERE e.course_id = discussion_threads.course_id 
    AND e.user_id = auth.uid()
    AND e.access_status = 'active'
    AND e.payment_status IN ('paid', 'partial')
  )
);
