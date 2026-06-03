import { createClient } from '@supabase/supabase-js';

// Fallback to placeholder strings during build time so the Next.js compiler doesn't crash
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

// Log a warning instead of throwing a hard error that kills the deployment
if (supabaseUrl === 'https://placeholder-url.supabase.co' || supabaseKey === 'placeholder-anon-key') {
  console.warn(
    '⚠️ Warning: Supabase environment variables are missing. Using placeholders for build compilation.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);
