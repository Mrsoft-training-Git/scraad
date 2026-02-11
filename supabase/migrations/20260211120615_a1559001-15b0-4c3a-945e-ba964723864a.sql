
-- Remove the overly permissive service role policy (service_role key bypasses RLS anyway)
DROP POLICY IF EXISTS "Service role can manage all enrollments" ON public.enrollments;
