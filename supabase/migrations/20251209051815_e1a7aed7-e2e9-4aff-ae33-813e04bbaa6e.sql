-- Create function to atomically increment students_count
CREATE OR REPLACE FUNCTION public.increment_students_count(course_id_input uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE courses
  SET students_count = COALESCE(students_count, 0) + 1
  WHERE id = course_id_input;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.increment_students_count(uuid) TO authenticated;