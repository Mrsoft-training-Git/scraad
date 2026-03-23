
-- Allow students to insert their own results
CREATE POLICY "Users can insert own results"
ON cbt_results
FOR INSERT
TO public
WITH CHECK (auth.uid() = user_id);

-- Allow students to update their own results (for theory grading edge case)
CREATE POLICY "Users can update own results"
ON cbt_results
FOR UPDATE
TO public
USING (auth.uid() = user_id);
