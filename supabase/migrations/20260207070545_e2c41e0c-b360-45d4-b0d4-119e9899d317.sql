-- Make the assignment-submissions bucket public so direct URLs work
UPDATE storage.buckets 
SET public = true 
WHERE id = 'assignment-submissions';