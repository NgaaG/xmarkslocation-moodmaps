import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with your credentials from .env.local
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ownenugkoyefnewcwxdx.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93bmVudWdrb3llZm5ld2N3eGR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0NTE3MzksImV4cCI6MjA4MDAyNzczOX0.TGywF_RxAANF_1EK7901zLm1XfJ0rVP27yFHHirTGM4LIC_KEY';

// Log initialization (for debugging)
console.log('[Supabase] Initializing with URL:', supabaseUrl?.substring(0, 30) + '...');

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
