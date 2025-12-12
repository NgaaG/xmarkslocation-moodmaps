-- Drop restrictive policies that require auth.uid()
DROP POLICY IF EXISTS "Users can create their own journal entries" ON public.journal_entries;
DROP POLICY IF EXISTS "Users can delete their own journal entries" ON public.journal_entries;
DROP POLICY IF EXISTS "Users can update their own journal entries" ON public.journal_entries;
DROP POLICY IF EXISTS "Users can view their own journal entries" ON public.journal_entries;

-- Create permissive policies that allow access for all users (since no auth is implemented)
CREATE POLICY "Allow all inserts" 
ON public.journal_entries 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow all selects" 
ON public.journal_entries 
FOR SELECT 
USING (true);

CREATE POLICY "Allow all updates" 
ON public.journal_entries 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow all deletes" 
ON public.journal_entries 
FOR DELETE 
USING (true);