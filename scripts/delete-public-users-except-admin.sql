-- DELETE ALL USERS FROM PUBLIC.USERS TABLE EXCEPT ADMIN

-- First, verify what we're about to delete
SELECT 'Users to be deleted from public.users:' as info;
SELECT id, email, username FROM public.users 
WHERE username != 'admin' AND email != 'admin@example.com';

-- Count of users to be deleted
SELECT COUNT(*) as users_to_delete FROM public.users 
WHERE username != 'admin' AND email != 'admin@example.com';

-- DELETE ALL RELATED DATA FIRST (using user IDs from public.users)

-- 1. Delete credit transactions for non-admin users
DELETE FROM credit_transactions 
WHERE user_id IN (
    SELECT id FROM public.users 
    WHERE username != 'admin' AND email != 'admin@example.com'
);

-- 2. Delete payment transactions for non-admin users
DELETE FROM payment_transactions 
WHERE user_id IN (
    SELECT id FROM public.users 
    WHERE username != 'admin' AND email != 'admin@example.com'
);

-- 3. Delete extracted contacts for non-admin users
DELETE FROM extracted_contacts 
WHERE user_id IN (
    SELECT id FROM public.users 
    WHERE username != 'admin' AND email != 'admin@example.com'
);

-- 4. Delete user credits for non-admin users
DELETE FROM user_credits 
WHERE user_id IN (
    SELECT id FROM public.users 
    WHERE username != 'admin' AND email != 'admin@example.com'
);

-- 5. Delete from auth.users (if they exist there)
DELETE FROM auth.users 
WHERE id IN (
    SELECT id FROM public.users 
    WHERE username != 'admin' AND email != 'admin@example.com'
);

-- 6. Finally, delete from public.users
DELETE FROM public.users 
WHERE username != 'admin' AND email != 'admin@example.com';

-- Verify only admin remains
SELECT 'Remaining users in public.users:' as info;
SELECT * FROM public.users;

SELECT 'Remaining users in auth.users:' as info;
SELECT COUNT(*) FROM auth.users;
