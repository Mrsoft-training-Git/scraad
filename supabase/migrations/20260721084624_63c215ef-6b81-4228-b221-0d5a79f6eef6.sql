CREATE POLICY "Users can enroll themselves in programs"
ON public.program_enrollments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);