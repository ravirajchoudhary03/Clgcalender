const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env');
    // We don't exit process here so we can show helpful errors later
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('⚡ Supabase client initialized');

module.exports = supabase;
