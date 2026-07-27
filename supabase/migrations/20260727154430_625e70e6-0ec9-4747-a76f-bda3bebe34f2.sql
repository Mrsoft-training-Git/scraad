ALTER TABLE public.program_enrollments
  ADD CONSTRAINT program_enrollments_user_id_profiles_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

CREATE POLICY "Instructors can view profiles of their program students"
ON public.profiles FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.program_enrollments pe
  JOIN public.programs p ON p.id = pe.program_id
  WHERE pe.user_id = profiles.id AND p.instructor_id = auth.uid()
));

CREATE TABLE public.program_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'present',
  note text,
  marked_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT program_attendance_status_check CHECK (status IN ('present','absent','late','excused')),
  CONSTRAINT program_attendance_unique UNIQUE (program_id, user_id, session_date)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.program_attendance TO authenticated;
GRANT ALL ON public.program_attendance TO service_role;

ALTER TABLE public.program_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage program attendance"
ON public.program_attendance FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Instructors manage attendance for their programs"
ON public.program_attendance FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.programs p WHERE p.id = program_id AND p.instructor_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.programs p WHERE p.id = program_id AND p.instructor_id = auth.uid()));

CREATE POLICY "Students view own program attendance"
ON public.program_attendance FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE TRIGGER update_program_attendance_updated_at
BEFORE UPDATE ON public.program_attendance
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();