-- Script to delete all users except admin
-- This will cascade delete related data due to foreign key constraints

-- IMPORTANT: Replace 'YOUR_ADMIN_EMAIL' with your actual admin email in ALL queries below

-- First, let's see who will be deleted (for safety)
SELECT id, email, created_at 
FROM auth.users 
WHERE email != 'YOUR_ADMIN_EMAIL';

-- Count of users to be deleted
SELECT COUNT(*) as users_to_delete 
FROM auth.users 
WHERE email != 'YOUR_ADMIN_EMAIL';

-- Delete all credit transactions for non-admin users
DELETE FROM credit_transactions
WHERE user_id IN (
    SELECT id FROM auth.users 
    WHERE email != 'YOUR_ADMIN_EMAIL'
);

-- Delete all payment transactions for non-admin users
DELETE FROM payment_transactions
WHERE user_id IN (
    SELECT id FROM auth.users 
    WHERE email != 'YOUR_ADMIN_EMAIL'
);

-- Delete all extracted contacts for non-admin users
DELETE FROM extracted_contacts
WHERE user_id IN (
    SELECT id FROM auth.users 
    WHERE email != 'YOUR_ADMIN_EMAIL'
);

-- Delete all user credits for non-admin users
DELETE FROM user_credits
WHERE user_id IN (
    SELECT id FROM auth.users 
    WHERE email != 'YOUR_ADMIN_EMAIL'
);

-- Finally, delete all non-admin users from auth.users
DELETE FROM auth.users 
WHERE email != 'YOUR_ADMIN_EMAIL';

-- Verify only admin remains
SELECT id, email, created_at 
FROM auth.users;
