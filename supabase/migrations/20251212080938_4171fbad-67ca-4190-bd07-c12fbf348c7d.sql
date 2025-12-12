-- Create table for storing knowledge check questions
CREATE TABLE public.knowledge_check_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID NOT NULL REFERENCES public.course_content(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_answer INTEGER NOT NULL,
  explanation TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.knowledge_check_questions ENABLE ROW LEVEL SECURITY;

-- Admins can manage all questions
CREATE POLICY "Admins can manage all knowledge check questions"
ON public.knowledge_check_questions
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Instructors can manage questions for their course content
CREATE POLICY "Instructors can manage knowledge check questions for their courses"
ON public.knowledge_check_questions
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM course_content cc
    JOIN courses c ON cc.course_id = c.id
    WHERE cc.id = knowledge_check_questions.content_id
    AND c.instructor_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM course_content cc
    JOIN courses c ON cc.course_id = c.id
    WHERE cc.id = knowledge_check_questions.content_id
    AND c.instructor_id = auth.uid()
  )
);

-- Students can view questions for published content in enrolled courses
CREATE POLICY "Students can view knowledge check questions for enrolled courses"
ON public.knowledge_check_questions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM course_content cc
    JOIN enrolled_courses ec ON ec.course_id = cc.course_id
    WHERE cc.id = knowledge_check_questions.content_id
    AND cc.is_published = true
    AND ec.user_id = auth.uid()
  )
);

-- Create table for storing student quiz attempts/answers
CREATE TABLE public.knowledge_check_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content_id UUID NOT NULL REFERENCES public.course_content(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  score INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.knowledge_check_attempts ENABLE ROW LEVEL SECURITY;

-- Users can manage their own attempts
CREATE POLICY "Users can view their own attempts"
ON public.knowledge_check_attempts
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own attempts"
ON public.knowledge_check_attempts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own attempts"
ON public.knowledge_check_attempts
FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can view all attempts
CREATE POLICY "Admins can view all attempts"
ON public.knowledge_check_attempts
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Instructors can view attempts for their courses
CREATE POLICY "Instructors can view attempts for their courses"
ON public.knowledge_check_attempts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM course_content cc
    JOIN courses c ON cc.course_id = c.id
    WHERE cc.id = knowledge_check_attempts.content_id
    AND c.instructor_id = auth.uid()
  )
);

-- Create trigger for updating timestamps
CREATE TRIGGER update_knowledge_check_questions_updated_at
BEFORE UPDATE ON public.knowledge_check_questions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();