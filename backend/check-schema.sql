-- Check the actual column type of user_id in habits table
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name IN ('habits', 'assignments', 'exams', 'subjects')
  AND column_name = 'user_id'
ORDER BY table_name;

-- Check existing RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename IN ('habits', 'assignments', 'exams', 'subjects')
ORDER BY tablename, policyname;
