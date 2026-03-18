
-- Programs table
CREATE TABLE public.programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  short_description text,
  banner_image_url text,
  duration text,
  mode text NOT NULL DEFAULT 'physical' CHECK (mode IN ('physical', 'hybrid', 'online')),
  location text,
  start_date date,
  end_date date,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'ongoing', 'closed')),
  max_participants integer,
  requirements text[] DEFAULT '{}',
  learning_outcomes text[] DEFAULT '{}',
  schedule jsonb DEFAULT '[]'::jsonb,
  instructor_name text,
  instructor_id uuid,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;

-- Anyone can view programs
CREATE POLICY "Anyone can view programs" ON public.programs
  FOR SELECT USING (true);

-- Admins can manage programs
CREATE POLICY "Admins can manage programs" ON public.programs
  FOR ALL USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Instructors can view their assigned programs
CREATE POLICY "Instructors can view assigned programs" ON public.programs
  FOR SELECT USING (instructor_id = auth.uid());

-- Program applications table
CREATE TABLE public.program_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  experience_level text,
  motivation text,
  cv_url text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(program_id, user_id)
);

ALTER TABLE public.program_applications ENABLE ROW LEVEL SECURITY;

-- Users can submit their own applications
CREATE POLICY "Users can submit applications" ON public.program_applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view their own applications
CREATE POLICY "Users can view own applications" ON public.program_applications
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can manage all applications
CREATE POLICY "Admins can manage all applications" ON public.program_applications
  FOR ALL USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Updated_at triggers
CREATE TRIGGER update_programs_updated_at
  BEFORE UPDATE ON public.programs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_program_applications_updated_at
  BEFORE UPDATE ON public.program_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
