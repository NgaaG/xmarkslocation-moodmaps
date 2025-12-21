-- Add spotify_playlist_link column to journal_entries table
ALTER TABLE public.journal_entries 
ADD COLUMN IF NOT EXISTS spotify_playlist_link TEXT;