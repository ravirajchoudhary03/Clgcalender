const { supabase } = require('./src/config/supabase');

console.log('Supabase Type:', typeof supabase);
console.log('Has Auth:', !!supabase?.auth);

if (!supabase || !supabase.auth) {
    console.error('CRITICAL: Supabase client is malformed');
    process.exit(1);
}

async function test() {
    console.log('Testing getUser with invalid token...');
    try {
        const { data, error } = await supabase.auth.getUser('invalid_token');
        console.log('Data:', data);
        console.log('Error:', error); // Expecting error for invalid token
    } catch (e) {
        console.error('CRASHED:', e);
    }
}

test();
