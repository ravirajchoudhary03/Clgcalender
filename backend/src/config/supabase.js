const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env');
}

// Global anonymous client (use only for public data if any)
const supabase = createClient(supabaseUrl, supabaseKey);

// Helper to get authenticated client for RLS
const getClient = (token) => {
    if (!token) return supabase;

    return createClient(supabaseUrl, supabaseKey, {
        global: {
            headers: {
                Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}`
            }
        }
    });
}

console.log('⚡ Supabase client initialized');

module.exports = { supabase, getClient };
