-- Allow instructors to upload course images
CREATE POLICY "Instructors can upload course images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'course-images' 
  AND has_role(auth.uid(), 'instructor'::app_role)
);

-- Allow instructors to update their course images
CREATE POLICY "Instructors can update course images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'course-images' 
  AND has_role(auth.uid(), 'instructor'::app_role)
);

-- Allow instructors to delete course images
CREATE POLICY "Instructors can delete course images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'course-images' 
  AND has_role(auth.uid(), 'instructor'::app_role)
);

-- Also allow instructors to upload course content files
CREATE POLICY "Instructors can upload course content"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'course-content' 
  AND has_role(auth.uid(), 'instructor'::app_role)
);

-- Allow instructors to update course content files
CREATE POLICY "Instructors can update course content"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'course-content' 
  AND has_role(auth.uid(), 'instructor'::app_role)
);

-- Allow instructors to delete course content files
CREATE POLICY "Instructors can delete course content"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'course-content' 
  AND has_role(auth.uid(), 'instructor'::app_role)
);