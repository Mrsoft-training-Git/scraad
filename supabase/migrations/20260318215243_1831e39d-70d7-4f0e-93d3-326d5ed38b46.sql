-- Create storage bucket for program images
INSERT INTO storage.buckets (id, name, public) VALUES ('program-images', 'program-images', true) ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload program images
CREATE POLICY "Admins can upload program images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'program-images' AND public.has_role(auth.uid(), 'admin'));

-- Allow anyone to view program images
CREATE POLICY "Anyone can view program images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'program-images');

-- Allow admins to delete program images
CREATE POLICY "Admins can delete program images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'program-images' AND public.has_role(auth.uid(), 'admin'));