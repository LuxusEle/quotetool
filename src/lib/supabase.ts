import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fejzgyzzqszsvjzvkois.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key-for-local-fallback';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
