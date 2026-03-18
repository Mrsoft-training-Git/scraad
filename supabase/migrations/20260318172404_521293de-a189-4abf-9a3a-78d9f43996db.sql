
-- Program enrollments (for admitted participants)
CREATE TABLE public.program_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'withdrawn')),
  progress integer DEFAULT 0,
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  UNIQUE(program_id, user_id)
);
ALTER TABLE public.program_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own program enrollments" ON public.program_enrollments
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all program enrollments" ON public.program_enrollments
  FOR ALL USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Program modules (schedule/content sections)
CREATE TABLE public.program_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  week_number integer,
  order_index integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.program_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enrolled users can view program modules" ON public.program_modules
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM program_enrollments pe WHERE pe.program_id = program_modules.program_id AND pe.user_id = auth.uid())
    OR has_role(auth.uid(), 'admin')
  );
CREATE POLICY "Admins can manage program modules" ON public.program_modules
  FOR ALL USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Program materials (learning content within modules)
CREATE TABLE public.program_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.program_modules(id) ON DELETE CASCADE,
  program_id uuid NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  material_type text NOT NULL DEFAULT 'document' CHECK (material_type IN ('video', 'document', 'link', 'file')),
  content_url text,
  file_path text,
  order_index integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.program_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enrolled users can view program materials" ON public.program_materials
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM program_enrollments pe WHERE pe.program_id = program_materials.program_id AND pe.user_id = auth.uid())
    OR has_role(auth.uid(), 'admin')
  );
CREATE POLICY "Admins can manage program materials" ON public.program_materials
  FOR ALL USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Program assignments
CREATE TABLE public.program_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  module_id uuid REFERENCES public.program_modules(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  due_date timestamptz,
  max_score integer DEFAULT 100,
  is_published boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.program_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enrolled users can view published program assignments" ON public.program_assignments
  FOR SELECT USING (
    (is_published = true AND EXISTS (SELECT 1 FROM program_enrollments pe WHERE pe.program_id = program_assignments.program_id AND pe.user_id = auth.uid()))
    OR has_role(auth.uid(), 'admin')
  );
CREATE POLICY "Admins can manage program assignments" ON public.program_assignments
  FOR ALL USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Program assignment submissions
CREATE TABLE public.program_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.program_assignments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  text_content text,
  file_urls text[] DEFAULT '{}',
  score integer,
  feedback text,
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded')),
  submitted_at timestamptz NOT NULL DEFAULT now(),
  graded_at timestamptz
);
ALTER TABLE public.program_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own program submissions" ON public.program_submissions
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all program submissions" ON public.program_submissions
  FOR ALL USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Program exams
CREATE TABLE public.program_exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  time_limit_minutes integer DEFAULT 60,
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_published boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.program_exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enrolled users can view published program exams" ON public.program_exams
  FOR SELECT USING (
    (is_published = true AND EXISTS (SELECT 1 FROM program_enrollments pe WHERE pe.program_id = program_exams.program_id AND pe.user_id = auth.uid()))
    OR has_role(auth.uid(), 'admin')
  );
CREATE POLICY "Admins can manage program exams" ON public.program_exams
  FOR ALL USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Program exam results
CREATE TABLE public.program_exam_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid NOT NULL REFERENCES public.program_exams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  score integer,
  total_questions integer,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(exam_id, user_id)
);
ALTER TABLE public.program_exam_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own exam results" ON public.program_exam_results
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all exam results" ON public.program_exam_results
  FOR ALL USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Triggers for updated_at
CREATE TRIGGER update_program_modules_updated_at BEFORE UPDATE ON public.program_modules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_program_assignments_updated_at BEFORE UPDATE ON public.program_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
