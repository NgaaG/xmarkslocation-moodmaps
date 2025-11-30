import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with your credentials from .env.local
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://YOUR_PROJECT_REF.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_ANON_PUBLIC_KEY';

// Log initialization (for debugging)
console.log('[Supabase] Initializing with URL:', supabaseUrl?.substring(0, 30) + '...');

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
