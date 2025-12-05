-- Drop existing restrictive policies on course_modules
DROP POLICY IF EXISTS "Admins can manage all modules" ON public.course_modules;
DROP POLICY IF EXISTS "Students can view modules for enrolled courses" ON public.course_modules;

-- Create permissive policies for course_modules
CREATE POLICY "Admins can manage all modules" 
ON public.course_modules 
FOR ALL 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Students can view modules for enrolled courses" 
ON public.course_modules 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM enrolled_courses
    WHERE enrolled_courses.course_id = course_modules.course_id
    AND enrolled_courses.user_id = auth.uid()
  )
);

-- Drop existing restrictive policies on course_content
DROP POLICY IF EXISTS "Admins can manage all content" ON public.course_content;
DROP POLICY IF EXISTS "Students can view published content for enrolled courses" ON public.course_content;

-- Create permissive policies for course_content
CREATE POLICY "Admins can manage all content" 
ON public.course_content 
FOR ALL 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Students can view published content for enrolled courses" 
ON public.course_content 
FOR SELECT 
TO authenticated
USING (
  is_published = true AND EXISTS (
    SELECT 1 FROM enrolled_courses
    WHERE enrolled_courses.course_id = course_content.course_id
    AND enrolled_courses.user_id = auth.uid()
  )
);