-- Drop the existing constraint and add updated one with knowledge_check
ALTER TABLE public.course_content DROP CONSTRAINT IF EXISTS course_content_content_type_check;

ALTER TABLE public.course_content ADD CONSTRAINT course_content_content_type_check 
CHECK (content_type IN ('document', 'video', 'link', 'knowledge_check'));