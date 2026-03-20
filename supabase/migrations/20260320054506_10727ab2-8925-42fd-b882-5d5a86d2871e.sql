
-- CBT Exams table
CREATE TABLE public.cbt_exams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  exam_type TEXT NOT NULL CHECK (exam_type IN ('course', 'program')),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  shuffle_questions BOOLEAN NOT NULL DEFAULT false,
  allow_retake BOOLEAN NOT NULL DEFAULT false,
  max_attempts INTEGER NOT NULL DEFAULT 1,
  auto_submit BOOLEAN NOT NULL DEFAULT true,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT exam_link_check CHECK (
    (exam_type = 'course' AND course_id IS NOT NULL AND program_id IS NULL) OR
    (exam_type = 'program' AND program_id IS NOT NULL AND course_id IS NULL)
  )
);

-- CBT Questions table
CREATE TABLE public.cbt_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id UUID NOT NULL REFERENCES public.cbt_exams(id) ON DELETE CASCADE,
  question_type TEXT NOT NULL CHECK (question_type IN ('mcq', 'theory')),
  question_text TEXT NOT NULL,
  marks INTEGER NOT NULL DEFAULT 1,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- MCQ Options table
CREATE TABLE public.cbt_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES public.cbt_questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  option_label TEXT NOT NULL, -- A, B, C, D etc
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Exam Attempts table
CREATE TABLE public.cbt_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id UUID NOT NULL REFERENCES public.cbt_exams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'expired', 'auto_submitted')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at TIMESTAMPTZ,
  time_remaining_seconds INTEGER,
  tab_switch_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(exam_id, user_id, started_at)
);

-- Exam Answers table
CREATE TABLE public.cbt_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  attempt_id UUID NOT NULL REFERENCES public.cbt_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.cbt_questions(id) ON DELETE CASCADE,
  selected_option_id UUID REFERENCES public.cbt_options(id),
  theory_answer TEXT,
  is_correct BOOLEAN,
  marks_awarded INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(attempt_id, question_id)
);

-- Exam Results table
CREATE TABLE public.cbt_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  attempt_id UUID NOT NULL REFERENCES public.cbt_attempts(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES public.cbt_exams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  total_marks INTEGER NOT NULL DEFAULT 0,
  obtained_marks INTEGER NOT NULL DEFAULT 0,
  mcq_score INTEGER NOT NULL DEFAULT 0,
  theory_score INTEGER NOT NULL DEFAULT 0,
  theory_graded BOOLEAN NOT NULL DEFAULT false,
  percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  passed BOOLEAN,
  feedback TEXT,
  graded_by UUID,
  graded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(attempt_id)
);

-- Enable RLS on all tables
ALTER TABLE public.cbt_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cbt_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cbt_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cbt_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cbt_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cbt_results ENABLE ROW LEVEL SECURITY;

-- RLS for cbt_exams
CREATE POLICY "Admins can manage all exams" ON public.cbt_exams FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Instructors can manage their exams" ON public.cbt_exams FOR ALL 
USING (created_by = auth.uid() OR 
  (exam_type = 'course' AND EXISTS (SELECT 1 FROM courses WHERE id = cbt_exams.course_id AND instructor_id = auth.uid())))
WITH CHECK (created_by = auth.uid() OR 
  (exam_type = 'course' AND EXISTS (SELECT 1 FROM courses WHERE id = cbt_exams.course_id AND instructor_id = auth.uid())));

CREATE POLICY "Students can view published exams for enrolled courses" ON public.cbt_exams FOR SELECT
USING (
  is_published = true AND (
    (exam_type = 'course' AND EXISTS (
      SELECT 1 FROM enrollments e WHERE e.course_id = cbt_exams.course_id AND e.user_id = auth.uid() AND e.access_status = 'active' AND e.payment_status IN ('paid', 'partial')
    )) OR
    (exam_type = 'program' AND EXISTS (
      SELECT 1 FROM program_enrollments pe WHERE pe.program_id = cbt_exams.program_id AND pe.user_id = auth.uid()
    ))
  )
);

-- RLS for cbt_questions
CREATE POLICY "Admins can manage all questions" ON public.cbt_questions FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Instructors can manage questions for their exams" ON public.cbt_questions FOR ALL
USING (EXISTS (SELECT 1 FROM cbt_exams e WHERE e.id = cbt_questions.exam_id AND (e.created_by = auth.uid() OR (e.exam_type = 'course' AND EXISTS (SELECT 1 FROM courses c WHERE c.id = e.course_id AND c.instructor_id = auth.uid())))))
WITH CHECK (EXISTS (SELECT 1 FROM cbt_exams e WHERE e.id = cbt_questions.exam_id AND (e.created_by = auth.uid() OR (e.exam_type = 'course' AND EXISTS (SELECT 1 FROM courses c WHERE c.id = e.course_id AND c.instructor_id = auth.uid())))));

CREATE POLICY "Students can view questions for their active exams" ON public.cbt_questions FOR SELECT
USING (EXISTS (
  SELECT 1 FROM cbt_exams e WHERE e.id = cbt_questions.exam_id AND e.is_published = true AND (
    (e.exam_type = 'course' AND EXISTS (SELECT 1 FROM enrollments en WHERE en.course_id = e.course_id AND en.user_id = auth.uid() AND en.access_status = 'active')) OR
    (e.exam_type = 'program' AND EXISTS (SELECT 1 FROM program_enrollments pe WHERE pe.program_id = e.program_id AND pe.user_id = auth.uid()))
  )
));

-- RLS for cbt_options
CREATE POLICY "Admins can manage all options" ON public.cbt_options FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Instructors can manage options for their exams" ON public.cbt_options FOR ALL
USING (EXISTS (SELECT 1 FROM cbt_questions q JOIN cbt_exams e ON e.id = q.exam_id WHERE q.id = cbt_options.question_id AND (e.created_by = auth.uid() OR (e.exam_type = 'course' AND EXISTS (SELECT 1 FROM courses c WHERE c.id = e.course_id AND c.instructor_id = auth.uid())))))
WITH CHECK (EXISTS (SELECT 1 FROM cbt_questions q JOIN cbt_exams e ON e.id = q.exam_id WHERE q.id = cbt_options.question_id AND (e.created_by = auth.uid() OR (e.exam_type = 'course' AND EXISTS (SELECT 1 FROM courses c WHERE c.id = e.course_id AND c.instructor_id = auth.uid())))));

CREATE POLICY "Students can view options for active exams" ON public.cbt_options FOR SELECT
USING (EXISTS (
  SELECT 1 FROM cbt_questions q JOIN cbt_exams e ON e.id = q.exam_id WHERE q.id = cbt_options.question_id AND e.is_published = true AND (
    (e.exam_type = 'course' AND EXISTS (SELECT 1 FROM enrollments en WHERE en.course_id = e.course_id AND en.user_id = auth.uid() AND en.access_status = 'active')) OR
    (e.exam_type = 'program' AND EXISTS (SELECT 1 FROM program_enrollments pe WHERE pe.program_id = e.program_id AND pe.user_id = auth.uid()))
  )
));

-- RLS for cbt_attempts
CREATE POLICY "Admins can manage all attempts" ON public.cbt_attempts FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Instructors can view attempts for their exams" ON public.cbt_attempts FOR SELECT
USING (EXISTS (SELECT 1 FROM cbt_exams e WHERE e.id = cbt_attempts.exam_id AND (e.created_by = auth.uid() OR (e.exam_type = 'course' AND EXISTS (SELECT 1 FROM courses c WHERE c.id = e.course_id AND c.instructor_id = auth.uid())))));

CREATE POLICY "Users can manage own attempts" ON public.cbt_attempts FOR ALL
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RLS for cbt_answers
CREATE POLICY "Admins can manage all answers" ON public.cbt_answers FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Instructors can view answers for their exams" ON public.cbt_answers FOR SELECT
USING (EXISTS (SELECT 1 FROM cbt_attempts a JOIN cbt_exams e ON e.id = a.exam_id WHERE a.id = cbt_answers.attempt_id AND (e.created_by = auth.uid() OR (e.exam_type = 'course' AND EXISTS (SELECT 1 FROM courses c WHERE c.id = e.course_id AND c.instructor_id = auth.uid())))));

CREATE POLICY "Users can manage own answers" ON public.cbt_answers FOR ALL
USING (EXISTS (SELECT 1 FROM cbt_attempts a WHERE a.id = cbt_answers.attempt_id AND a.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM cbt_attempts a WHERE a.id = cbt_answers.attempt_id AND a.user_id = auth.uid()));

-- RLS for cbt_results
CREATE POLICY "Admins can manage all results" ON public.cbt_results FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Instructors can manage results for their exams" ON public.cbt_results FOR ALL
USING (EXISTS (SELECT 1 FROM cbt_exams e WHERE e.id = cbt_results.exam_id AND (e.created_by = auth.uid() OR (e.exam_type = 'course' AND EXISTS (SELECT 1 FROM courses c WHERE c.id = e.course_id AND c.instructor_id = auth.uid())))))
WITH CHECK (EXISTS (SELECT 1 FROM cbt_exams e WHERE e.id = cbt_results.exam_id AND (e.created_by = auth.uid() OR (e.exam_type = 'course' AND EXISTS (SELECT 1 FROM courses c WHERE c.id = e.course_id AND c.instructor_id = auth.uid())))));

CREATE POLICY "Users can view own results" ON public.cbt_results FOR SELECT
USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_cbt_exams_course ON public.cbt_exams(course_id) WHERE course_id IS NOT NULL;
CREATE INDEX idx_cbt_exams_program ON public.cbt_exams(program_id) WHERE program_id IS NOT NULL;
CREATE INDEX idx_cbt_questions_exam ON public.cbt_questions(exam_id);
CREATE INDEX idx_cbt_options_question ON public.cbt_options(question_id);
CREATE INDEX idx_cbt_attempts_exam_user ON public.cbt_attempts(exam_id, user_id);
CREATE INDEX idx_cbt_answers_attempt ON public.cbt_answers(attempt_id);
CREATE INDEX idx_cbt_results_exam_user ON public.cbt_results(exam_id, user_id);

-- Triggers for updated_at
CREATE TRIGGER update_cbt_exams_updated_at BEFORE UPDATE ON public.cbt_exams FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cbt_questions_updated_at BEFORE UPDATE ON public.cbt_questions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cbt_attempts_updated_at BEFORE UPDATE ON public.cbt_attempts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cbt_answers_updated_at BEFORE UPDATE ON public.cbt_answers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cbt_results_updated_at BEFORE UPDATE ON public.cbt_results FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
