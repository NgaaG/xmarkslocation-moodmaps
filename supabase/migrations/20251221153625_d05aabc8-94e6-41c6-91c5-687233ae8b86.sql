-- Drop insecure permissive policies
DROP POLICY IF EXISTS "Allow all inserts" ON public.journal_entries;
DROP POLICY IF EXISTS "Allow all selects" ON public.journal_entries;
DROP POLICY IF EXISTS "Allow all updates" ON public.journal_entries;
DROP POLICY IF EXISTS "Allow all deletes" ON public.journal_entries;

-- Also drop any old policies that might conflict
DROP POLICY IF EXISTS "Users can view own entries" ON public.journal_entries;
DROP POLICY IF EXISTS "Users can create own entries" ON public.journal_entries;
DROP POLICY IF EXISTS "Users can update own entries" ON public.journal_entries;
DROP POLICY IF EXISTS "Users can delete own entries" ON public.journal_entries;

-- Create secure auth-based RLS policies
CREATE POLICY "Users can view own entries"
  ON public.journal_entries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own entries"
  ON public.journal_entries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own entries"
  ON public.journal_entries FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own entries"
  ON public.journal_entries FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);