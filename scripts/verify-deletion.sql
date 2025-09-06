-- Verify the deletion was successful

-- 1. Check auth.users (should be empty or only have admin)
SELECT 'auth.users table:' as check_table;
SELECT COUNT(*) as total_users FROM auth.users;
SELECT * FROM auth.users;

-- 2. Check public.users (should only have admin)
SELECT 'public.users table:' as check_table;
SELECT COUNT(*) as total_users FROM public.users;
SELECT * FROM public.users;

-- 3. Check user_credits (should only have admin's credits)
SELECT 'user_credits table:' as check_table;
SELECT COUNT(*) as total_records FROM user_credits;
SELECT * FROM user_credits;

-- 4. Check credit_transactions (should be empty or only admin's)
SELECT 'credit_transactions table:' as check_table;
SELECT COUNT(*) as total_records FROM credit_transactions;

-- 5. Check payment_transactions (should be empty or only admin's)
SELECT 'payment_transactions table:' as check_table;
SELECT COUNT(*) as total_records FROM payment_transactions;

-- 6. Check extracted_contacts (should be empty or only admin's)
SELECT 'extracted_contacts table:' as check_table;
SELECT COUNT(*) as total_records FROM extracted_contacts;
