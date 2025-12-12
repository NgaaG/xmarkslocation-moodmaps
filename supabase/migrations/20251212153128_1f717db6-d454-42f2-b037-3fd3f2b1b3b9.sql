-- Create storage bucket for journey images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('journey-images', 'journey-images', true);

-- RLS policy to allow authenticated users to upload their journey images
CREATE POLICY "Users can upload their own journey images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'journey-images');

-- RLS policy to allow public viewing of journey images
CREATE POLICY "Anyone can view journey images" 
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'journey-images');

-- Add missing columns to journal_entries table
ALTER TABLE public.journal_entries 
ADD COLUMN IF NOT EXISTS location_title TEXT,
ADD COLUMN IF NOT EXISTS playlist_category_name TEXT,
ADD COLUMN IF NOT EXISTS spotify_playlist_name TEXT,
ADD COLUMN IF NOT EXISTS destination_photo TEXT,
ADD COLUMN IF NOT EXISTS combined_image_url TEXT;