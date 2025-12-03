-- Add top_rated column to courses
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS top_rated boolean DEFAULT false;

-- Create storage bucket for course images
INSERT INTO storage.buckets (id, name, public) VALUES ('course-images', 'course-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for course images
CREATE POLICY "Anyone can view course images"
ON storage.objects FOR SELECT
USING (bucket_id = 'course-images');

CREATE POLICY "Admins can upload course images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'course-images' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update course images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'course-images' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete course images"
ON storage.objects FOR DELETE
USING (bucket_id = 'course-images' AND has_role(auth.uid(), 'admin'));

-- Update RLS for enrolled_courses to allow students to enroll
CREATE POLICY "Users can enroll in courses"
ON public.enrolled_courses FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their enrollment"
ON public.enrolled_courses FOR UPDATE
USING (auth.uid() = user_id);

-- Add course_id foreign key to enrolled_courses for better tracking
ALTER TABLE public.enrolled_courses ADD COLUMN IF NOT EXISTS course_id uuid REFERENCES public.courses(id);