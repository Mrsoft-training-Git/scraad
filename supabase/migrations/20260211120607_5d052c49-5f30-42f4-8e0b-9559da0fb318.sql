
-- Add part payment columns to courses table
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS allows_part_payment boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS first_tranche_amount integer,
  ADD COLUMN IF NOT EXISTS second_tranche_amount integer,
  ADD COLUMN IF NOT EXISTS second_payment_due_days integer;

-- Create enrollments table for payment tracking
CREATE TABLE public.enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  payment_status text NOT NULL DEFAULT 'pending',
  first_payment_date timestamptz,
  second_payment_due_date timestamptz,
  second_payment_date timestamptz,
  access_status text NOT NULL DEFAULT 'locked',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id)
);

-- Enable RLS
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for enrollments
CREATE POLICY "Users can view their own enrollments"
  ON public.enrollments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own enrollments"
  ON public.enrollments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own enrollments"
  ON public.enrollments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all enrollments"
  ON public.enrollments FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Instructors can view enrollments for their courses"
  ON public.enrollments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM courses
    WHERE courses.id = enrollments.course_id
    AND courses.instructor_id = auth.uid()
  ));

-- Service role policy for webhook updates (no auth context)
CREATE POLICY "Service role can manage all enrollments"
  ON public.enrollments FOR ALL
  USING (true)
  WITH CHECK (true);
