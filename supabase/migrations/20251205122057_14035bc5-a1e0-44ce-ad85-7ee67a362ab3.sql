-- Create course_content table for storing course materials
CREATE TABLE public.course_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content_type TEXT NOT NULL CHECK (content_type IN ('document', 'video', 'link')),
  content_url TEXT,
  file_path TEXT,
  order_index INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.course_content ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage all content"
ON public.course_content
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Students can view published content for enrolled courses"
ON public.course_content
FOR SELECT
USING (
  is_published = true 
  AND EXISTS (
    SELECT 1 FROM public.enrolled_courses 
    WHERE enrolled_courses.course_id = course_content.course_id 
    AND enrolled_courses.user_id = auth.uid()
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_course_content_updated_at
BEFORE UPDATE ON public.course_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for course content files
INSERT INTO storage.buckets (id, name, public) VALUES ('course-content', 'course-content', true);

-- Storage policies for course content
CREATE POLICY "Admins can upload course content"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'course-content' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update course content files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'course-content' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete course content files"
ON storage.objects FOR DELETE
USING (bucket_id = 'course-content' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view course content files"
ON storage.objects FOR SELECT
USING (bucket_id = 'course-content');