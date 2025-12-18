-- 🆕 Add walk_duration_mins column for storing journey duration in minutes
ALTER TABLE public.journal_entries 
ADD COLUMN walk_duration_mins integer;