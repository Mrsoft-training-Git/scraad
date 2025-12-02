-- Create courses table
CREATE TABLE public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  price numeric NOT NULL,
  image_url text,
  category text NOT NULL,
  published boolean DEFAULT false,
  featured boolean DEFAULT false,
  instructor text,
  duration text,
  students_count integer DEFAULT 0,
  level text DEFAULT 'Beginner',
  what_you_learn text[] DEFAULT '{}',
  requirements text[] DEFAULT '{}',
  syllabus jsonb DEFAULT '[]',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view published courses
CREATE POLICY "Anyone can view published courses"
ON public.courses
FOR SELECT
USING (published = true);

-- Policy: Admins can view all courses
CREATE POLICY "Admins can view all courses"
ON public.courses
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Policy: Admins can insert courses
CREATE POLICY "Admins can insert courses"
ON public.courses
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Policy: Admins can update courses
CREATE POLICY "Admins can update courses"
ON public.courses
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Policy: Admins can delete courses
CREATE POLICY "Admins can delete courses"
ON public.courses
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_courses_updated_at
BEFORE UPDATE ON public.courses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();