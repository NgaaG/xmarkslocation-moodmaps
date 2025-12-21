-- Make bucket private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'journey-images';

-- Drop existing storage policies
DROP POLICY IF EXISTS "Anyone can view journey images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own journey images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;

-- Create secure policies scoped to user folders
CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'journey-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view own images"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'journey-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own images"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'journey-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'journey-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);