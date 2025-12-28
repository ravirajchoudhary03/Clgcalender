import { createClient } from '@supabase/supabase-js';

// These should be in .env in a real app, but for now we might use hardcoded or expect .env
// Vite exposes env vars with import.meta.env.VITE_
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase URL or Key");
    alert("CRITICAL ERROR: Supabase Keys missing!\n\nPlease check frontend/.env contains:\nVITE_SUPABASE_URL\nVITE_SUPABASE_ANON_KEY\n\nAnd RESTART the terminal.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
