
-- Programs: instructor update policy (view already exists)
CREATE POLICY "Instructors can update assigned programs"
ON public.programs FOR UPDATE
USING (instructor_id = auth.uid());

-- Program modules
CREATE POLICY "Instructors can manage modules for assigned programs"
ON public.program_modules FOR ALL
USING (EXISTS (SELECT 1 FROM programs WHERE programs.id = program_modules.program_id AND programs.instructor_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM programs WHERE programs.id = program_modules.program_id AND programs.instructor_id = auth.uid()));

-- Program materials
CREATE POLICY "Instructors can manage materials for assigned programs"
ON public.program_materials FOR ALL
USING (EXISTS (SELECT 1 FROM programs WHERE programs.id = program_materials.program_id AND programs.instructor_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM programs WHERE programs.id = program_materials.program_id AND programs.instructor_id = auth.uid()));

-- Program assignments
CREATE POLICY "Instructors can manage assignments for assigned programs"
ON public.program_assignments FOR ALL
USING (EXISTS (SELECT 1 FROM programs WHERE programs.id = program_assignments.program_id AND programs.instructor_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM programs WHERE programs.id = program_assignments.program_id AND programs.instructor_id = auth.uid()));

-- Program submissions
CREATE POLICY "Instructors can manage submissions for assigned programs"
ON public.program_submissions FOR ALL
USING (EXISTS (SELECT 1 FROM program_assignments pa JOIN programs p ON p.id = pa.program_id WHERE pa.id = program_submissions.assignment_id AND p.instructor_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM program_assignments pa JOIN programs p ON p.id = pa.program_id WHERE pa.id = program_submissions.assignment_id AND p.instructor_id = auth.uid()));

-- Program exams
CREATE POLICY "Instructors can manage exams for assigned programs"
ON public.program_exams FOR ALL
USING (EXISTS (SELECT 1 FROM programs WHERE programs.id = program_exams.program_id AND programs.instructor_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM programs WHERE programs.id = program_exams.program_id AND programs.instructor_id = auth.uid()));

-- Program exam results
CREATE POLICY "Instructors can view results for assigned programs"
ON public.program_exam_results FOR SELECT
USING (EXISTS (SELECT 1 FROM program_exams pe JOIN programs p ON p.id = pe.program_id WHERE pe.id = program_exam_results.exam_id AND p.instructor_id = auth.uid()));

-- Program enrollments
CREATE POLICY "Instructors can view enrollments for assigned programs"
ON public.program_enrollments FOR SELECT
USING (EXISTS (SELECT 1 FROM programs WHERE programs.id = program_enrollments.program_id AND programs.instructor_id = auth.uid()));
