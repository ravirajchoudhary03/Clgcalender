const supabase = require('../src/config/supabase');
const bcrypt = require('bcryptjs');

async function seed() {
    console.log('🌱 Seeding Supabase...');

    const email = 'student@example.com';
    const password = 'password123';

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    // Check if exists
    const { data: existing } = await supabase.from('users').select('*').eq('email', email).single();

    if (existing) {
        console.log('✅ Demo user already exists');
        return;
    }

    // Create user
    const { error } = await supabase.from('users').insert([
        { name: 'Demo Student', email, password: hashed }
    ]);

    if (error) {
        console.error('❌ Failed to create user:', error);
    } else {
        console.log('✅ Created demo user: student@example.com');
    }
}

seed();
