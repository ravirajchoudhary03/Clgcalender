const { supabase } = require('./src/config/supabase');

async function checkTable(tableName) {
    console.log(`Checking table: ${tableName}...`);
    try {
        const { data, error } = await supabase.from(tableName).select('id').limit(1);
        if (error) {
            console.error(`❌ Table '${tableName}' error:`, error.message);
            return false;
        }
        console.log(`✅ Table '${tableName}' exists.`);
        return true;
    } catch (e) {
        console.error(`❌ Table '${tableName}' crash:`, e.message);
        return false;
    }
}

async function run() {
    await checkTable('habits');
    await checkTable('habit_logs');
    await checkTable('assignments');
    await checkTable('exams');
    await checkTable('subjects');
    await checkTable('attendance_logs'); // Fix: check attendance_logs too
}

run();
