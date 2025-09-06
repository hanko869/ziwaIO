-- Check auth.users table
SELECT 'auth.users table:' as table_name;
SELECT * FROM auth.users;

-- Check if there's a public.users table
SELECT 'public.users table:' as table_name;
SELECT * FROM users;

-- Check user_credits table to see what user_ids exist
SELECT 'user_credits table - unique users:' as table_name;
SELECT DISTINCT user_id FROM user_credits;

-- Check credit_transactions to see what user_ids exist
SELECT 'credit_transactions table - unique users:' as table_name;
SELECT DISTINCT user_id FROM credit_transactions;

-- Check payment_transactions to see what user_ids exist  
SELECT 'payment_transactions table - unique users:' as table_name;
SELECT DISTINCT user_id FROM payment_transactions;

-- Check extracted_contacts to see what user_ids exist
SELECT 'extracted_contacts table - unique users:' as table_name;
SELECT DISTINCT user_id FROM extracted_contacts;

-- List all tables in your database to find where users might be stored
SELECT table_schema, table_name 
FROM information_schema.tables 
WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
AND table_name LIKE '%user%'
ORDER BY table_schema, table_name;
