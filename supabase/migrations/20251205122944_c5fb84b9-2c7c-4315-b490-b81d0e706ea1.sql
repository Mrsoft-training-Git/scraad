-- Create modules table
CREATE TABLE public.course_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;

-- RLS policies for modules
CREATE POLICY "Admins can manage all modules"
ON public.course_modules
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Students can view modules for enrolled courses"
ON public.course_modules
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM enrolled_courses
    WHERE enrolled_courses.course_id = course_modules.course_id
    AND enrolled_courses.user_id = auth.uid()
  )
);

-- Add module_id to course_content
ALTER TABLE public.course_content
ADD COLUMN module_id UUID REFERENCES public.course_modules(id) ON DELETE SET NULL;

-- Trigger for updated_at
CREATE TRIGGER update_course_modules_updated_at
BEFORE UPDATE ON public.course_modules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();