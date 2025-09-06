-- 1. Check auth.users table
SELECT 'AUTH.USERS TABLE:' as source;
SELECT id, email, created_at FROM auth.users;

-- 2. Check public.users table  
SELECT 'PUBLIC.USERS TABLE:' as source;
SELECT * FROM public.users;

-- 3. Check which users have data in other tables
SELECT 'USERS WITH CREDITS:' as source;
SELECT uc.user_id, uc.balance, uc.total_used, au.email
FROM user_credits uc
LEFT JOIN auth.users au ON uc.user_id = au.id;

-- 4. Find admin user (check both tables)
SELECT 'LOOKING FOR ADMIN:' as source;
SELECT id, email FROM auth.users WHERE email = 'admin' OR email LIKE '%admin%';
SELECT * FROM public.users WHERE username = 'admin' OR email = 'admin';

-- ONCE YOU IDENTIFY YOUR ADMIN USER, USE ONE OF THESE SCRIPTS:

-- OPTION A: If admin is in auth.users with a specific email
-- Replace 'ADMIN_EMAIL_HERE' with the actual admin email
/*
DELETE FROM credit_transactions WHERE user_id NOT IN (SELECT id FROM auth.users WHERE email = 'ADMIN_EMAIL_HERE');
DELETE FROM payment_transactions WHERE user_id NOT IN (SELECT id FROM auth.users WHERE email = 'ADMIN_EMAIL_HERE');
DELETE FROM extracted_contacts WHERE user_id NOT IN (SELECT id FROM auth.users WHERE email = 'ADMIN_EMAIL_HERE');
DELETE FROM user_credits WHERE user_id NOT IN (SELECT id FROM auth.users WHERE email = 'ADMIN_EMAIL_HERE');
DELETE FROM auth.users WHERE email != 'ADMIN_EMAIL_HERE';
*/

-- OPTION B: If admin is in public.users with username 'admin'
-- First get the user_id for admin from public.users
/*
-- Get admin's user_id
SELECT id FROM public.users WHERE username = 'admin';
-- Then use that ID (replace 'ADMIN_USER_ID' with the actual UUID)
DELETE FROM credit_transactions WHERE user_id != 'ADMIN_USER_ID';
DELETE FROM payment_transactions WHERE user_id != 'ADMIN_USER_ID';
DELETE FROM extracted_contacts WHERE user_id != 'ADMIN_USER_ID';
DELETE FROM user_credits WHERE user_id != 'ADMIN_USER_ID';
DELETE FROM auth.users WHERE id != 'ADMIN_USER_ID';
DELETE FROM public.users WHERE id != 'ADMIN_USER_ID';
*/

-- OPTION C: Delete all users except a specific ID
-- Replace 'YOUR_ADMIN_ID' with the actual UUID
/*
DELETE FROM credit_transactions WHERE user_id != 'YOUR_ADMIN_ID';
DELETE FROM payment_transactions WHERE user_id != 'YOUR_ADMIN_ID';
DELETE FROM extracted_contacts WHERE user_id != 'YOUR_ADMIN_ID';
DELETE FROM user_credits WHERE user_id != 'YOUR_ADMIN_ID';
DELETE FROM auth.users WHERE id != 'YOUR_ADMIN_ID';
DELETE FROM public.users WHERE id != 'YOUR_ADMIN_ID';
*/
