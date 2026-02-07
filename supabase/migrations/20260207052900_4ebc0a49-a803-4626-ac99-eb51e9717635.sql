-- ===========================================
-- INSTRUCTOR-STUDENT ENGAGEMENT SYSTEM
-- ===========================================

-- 1. COURSE ANNOUNCEMENTS (Broadcasts with replies)
-- ===========================================
CREATE TABLE public.course_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Announcement replies
CREATE TABLE public.announcement_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES public.course_announcements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. DISCUSSION THREADS (Forum-style Q&A)
-- ===========================================
CREATE TABLE public.discussion_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_resolved BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Discussion replies/answers
CREATE TABLE public.discussion_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.discussion_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_answer BOOLEAN DEFAULT false,
  upvotes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. COURSE ASSIGNMENTS
-- ===========================================
CREATE TABLE public.course_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  module_id UUID REFERENCES public.course_modules(id) ON DELETE SET NULL,
  instructor_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  due_date TIMESTAMPTZ NOT NULL,
  max_score INTEGER DEFAULT 100,
  -- Rubric as JSON array: [{criterion: string, max_points: number, description: string}]
  rubric JSONB DEFAULT '[]'::jsonb,
  -- Allowed submission types: text, file, link, code
  allowed_types TEXT[] DEFAULT ARRAY['text', 'file'],
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Student assignment submissions
CREATE TABLE public.assignment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.course_assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  -- Submission content
  text_content TEXT,
  file_urls TEXT[],
  link_urls TEXT[],
  code_content TEXT,
  code_language TEXT,
  -- Grading
  score INTEGER,
  -- Rubric scores: [{criterion: string, points: number, feedback: string}]
  rubric_scores JSONB DEFAULT '[]'::jsonb,
  feedback TEXT,
  graded_at TIMESTAMPTZ,
  graded_by UUID,
  -- Status: draft, submitted, graded, returned
  status TEXT DEFAULT 'draft',
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(assignment_id, student_id)
);

-- ===========================================
-- ENABLE RLS ON ALL TABLES
-- ===========================================
ALTER TABLE public.course_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- RLS POLICIES: COURSE ANNOUNCEMENTS
-- ===========================================

-- Admins can manage all announcements
CREATE POLICY "Admins can manage all announcements"
ON public.course_announcements FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Instructors can manage announcements for their courses
CREATE POLICY "Instructors can manage their course announcements"
ON public.course_announcements FOR ALL
USING (instructor_id = auth.uid() OR EXISTS (
  SELECT 1 FROM courses WHERE courses.id = course_announcements.course_id AND courses.instructor_id = auth.uid()
))
WITH CHECK (instructor_id = auth.uid() OR EXISTS (
  SELECT 1 FROM courses WHERE courses.id = course_announcements.course_id AND courses.instructor_id = auth.uid()
));

-- Students can view announcements for enrolled courses
CREATE POLICY "Students can view announcements for enrolled courses"
ON public.course_announcements FOR SELECT
USING (EXISTS (
  SELECT 1 FROM enrolled_courses WHERE enrolled_courses.course_id = course_announcements.course_id AND enrolled_courses.user_id = auth.uid()
));

-- ===========================================
-- RLS POLICIES: ANNOUNCEMENT REPLIES
-- ===========================================

-- Admins can manage all replies
CREATE POLICY "Admins can manage all announcement replies"
ON public.announcement_replies FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Users can create replies on announcements they can view
CREATE POLICY "Users can create announcement replies"
ON public.announcement_replies FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM course_announcements ca
  JOIN enrolled_courses ec ON ec.course_id = ca.course_id
  WHERE ca.id = announcement_replies.announcement_id AND ec.user_id = auth.uid()
) OR EXISTS (
  SELECT 1 FROM course_announcements ca
  JOIN courses c ON c.id = ca.course_id
  WHERE ca.id = announcement_replies.announcement_id AND c.instructor_id = auth.uid()
));

-- Users can update their own replies
CREATE POLICY "Users can update their own announcement replies"
ON public.announcement_replies FOR UPDATE
USING (user_id = auth.uid());

-- Users can delete their own replies
CREATE POLICY "Users can delete their own announcement replies"
ON public.announcement_replies FOR DELETE
USING (user_id = auth.uid());

-- Users can view replies on announcements they can access
CREATE POLICY "Users can view announcement replies"
ON public.announcement_replies FOR SELECT
USING (EXISTS (
  SELECT 1 FROM course_announcements ca
  JOIN enrolled_courses ec ON ec.course_id = ca.course_id
  WHERE ca.id = announcement_replies.announcement_id AND ec.user_id = auth.uid()
) OR EXISTS (
  SELECT 1 FROM course_announcements ca
  JOIN courses c ON c.id = ca.course_id
  WHERE ca.id = announcement_replies.announcement_id AND c.instructor_id = auth.uid()
) OR has_role(auth.uid(), 'admin'));

-- ===========================================
-- RLS POLICIES: DISCUSSION THREADS
-- ===========================================

-- Admins can manage all threads
CREATE POLICY "Admins can manage all discussion threads"
ON public.discussion_threads FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Instructors can manage threads in their courses
CREATE POLICY "Instructors can manage course discussion threads"
ON public.discussion_threads FOR ALL
USING (EXISTS (
  SELECT 1 FROM courses WHERE courses.id = discussion_threads.course_id AND courses.instructor_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM courses WHERE courses.id = discussion_threads.course_id AND courses.instructor_id = auth.uid()
));

-- Enrolled students can create and view threads
CREATE POLICY "Students can create discussion threads"
ON public.discussion_threads FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM enrolled_courses WHERE enrolled_courses.course_id = discussion_threads.course_id AND enrolled_courses.user_id = auth.uid()
));

CREATE POLICY "Students can view discussion threads"
ON public.discussion_threads FOR SELECT
USING (EXISTS (
  SELECT 1 FROM enrolled_courses WHERE enrolled_courses.course_id = discussion_threads.course_id AND enrolled_courses.user_id = auth.uid()
));

-- Users can update their own threads
CREATE POLICY "Users can update their own threads"
ON public.discussion_threads FOR UPDATE
USING (user_id = auth.uid());

-- ===========================================
-- RLS POLICIES: DISCUSSION REPLIES
-- ===========================================

-- Admins can manage all discussion replies
CREATE POLICY "Admins can manage all discussion replies"
ON public.discussion_replies FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Instructors can manage replies in their courses
CREATE POLICY "Instructors can manage discussion replies"
ON public.discussion_replies FOR ALL
USING (EXISTS (
  SELECT 1 FROM discussion_threads dt
  JOIN courses c ON c.id = dt.course_id
  WHERE dt.id = discussion_replies.thread_id AND c.instructor_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM discussion_threads dt
  JOIN courses c ON c.id = dt.course_id
  WHERE dt.id = discussion_replies.thread_id AND c.instructor_id = auth.uid()
));

-- Enrolled users can create replies
CREATE POLICY "Users can create discussion replies"
ON public.discussion_replies FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM discussion_threads dt
  JOIN enrolled_courses ec ON ec.course_id = dt.course_id
  WHERE dt.id = discussion_replies.thread_id AND ec.user_id = auth.uid()
) OR EXISTS (
  SELECT 1 FROM discussion_threads dt
  JOIN courses c ON c.id = dt.course_id
  WHERE dt.id = discussion_replies.thread_id AND c.instructor_id = auth.uid()
));

-- Users can view replies on accessible threads
CREATE POLICY "Users can view discussion replies"
ON public.discussion_replies FOR SELECT
USING (EXISTS (
  SELECT 1 FROM discussion_threads dt
  JOIN enrolled_courses ec ON ec.course_id = dt.course_id
  WHERE dt.id = discussion_replies.thread_id AND ec.user_id = auth.uid()
) OR EXISTS (
  SELECT 1 FROM discussion_threads dt
  JOIN courses c ON c.id = dt.course_id
  WHERE dt.id = discussion_replies.thread_id AND c.instructor_id = auth.uid()
) OR has_role(auth.uid(), 'admin'));

-- Users can update their own replies
CREATE POLICY "Users can update their own discussion replies"
ON public.discussion_replies FOR UPDATE
USING (user_id = auth.uid());

-- Users can delete their own replies
CREATE POLICY "Users can delete their own discussion replies"
ON public.discussion_replies FOR DELETE
USING (user_id = auth.uid());

-- ===========================================
-- RLS POLICIES: COURSE ASSIGNMENTS
-- ===========================================

-- Admins can manage all assignments
CREATE POLICY "Admins can manage all assignments"
ON public.course_assignments FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Instructors can manage assignments for their courses
CREATE POLICY "Instructors can manage their course assignments"
ON public.course_assignments FOR ALL
USING (instructor_id = auth.uid() OR EXISTS (
  SELECT 1 FROM courses WHERE courses.id = course_assignments.course_id AND courses.instructor_id = auth.uid()
))
WITH CHECK (instructor_id = auth.uid() OR EXISTS (
  SELECT 1 FROM courses WHERE courses.id = course_assignments.course_id AND courses.instructor_id = auth.uid()
));

-- Students can view published assignments for enrolled courses
CREATE POLICY "Students can view published assignments"
ON public.course_assignments FOR SELECT
USING (is_published = true AND EXISTS (
  SELECT 1 FROM enrolled_courses WHERE enrolled_courses.course_id = course_assignments.course_id AND enrolled_courses.user_id = auth.uid()
));

-- ===========================================
-- RLS POLICIES: ASSIGNMENT SUBMISSIONS
-- ===========================================

-- Admins can manage all submissions
CREATE POLICY "Admins can manage all submissions"
ON public.assignment_submissions FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Instructors can view and grade submissions for their assignments
CREATE POLICY "Instructors can manage submissions for their assignments"
ON public.assignment_submissions FOR ALL
USING (EXISTS (
  SELECT 1 FROM course_assignments ca
  JOIN courses c ON c.id = ca.course_id
  WHERE ca.id = assignment_submissions.assignment_id AND c.instructor_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM course_assignments ca
  JOIN courses c ON c.id = ca.course_id
  WHERE ca.id = assignment_submissions.assignment_id AND c.instructor_id = auth.uid()
));

-- Students can manage their own submissions
CREATE POLICY "Students can manage their own submissions"
ON public.assignment_submissions FOR ALL
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

-- ===========================================
-- TRIGGERS FOR UPDATED_AT
-- ===========================================
CREATE TRIGGER update_course_announcements_updated_at
  BEFORE UPDATE ON public.course_announcements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_announcement_replies_updated_at
  BEFORE UPDATE ON public.announcement_replies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_discussion_threads_updated_at
  BEFORE UPDATE ON public.discussion_threads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_discussion_replies_updated_at
  BEFORE UPDATE ON public.discussion_replies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_course_assignments_updated_at
  BEFORE UPDATE ON public.course_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assignment_submissions_updated_at
  BEFORE UPDATE ON public.assignment_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===========================================
-- STORAGE BUCKET FOR ASSIGNMENT FILES
-- ===========================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('assignment-submissions', 'assignment-submissions', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for assignment submissions
CREATE POLICY "Students can upload their own assignment files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'assignment-submissions' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Students can view their own assignment files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'assignment-submissions' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Instructors can view assignment files for their courses"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'assignment-submissions'
  AND EXISTS (
    SELECT 1 FROM courses c
    WHERE c.instructor_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all assignment files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'assignment-submissions'
  AND has_role(auth.uid(), 'admin')
);