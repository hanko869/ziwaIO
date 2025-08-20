-- First, let's see ALL users in the database
SELECT id, email, created_at 
FROM auth.users
ORDER BY created_at;

-- Count total users
SELECT COUNT(*) as total_users 
FROM auth.users;

-- Now you can identify which email you want to keep as admin
-- Then use these queries, replacing 'admin@example.com' with the email you want to keep:

-- See who will be deleted (replace admin@example.com with your admin email)
SELECT id, email, created_at 
FROM auth.users 
WHERE email != 'admin@example.com';

-- Count who will be deleted
SELECT COUNT(*) as users_to_delete 
FROM auth.users 
WHERE email != 'admin@example.com';

-- If you're ready to delete, run these (replace admin@example.com with your admin email):

-- Delete all credit transactions for non-admin users
DELETE FROM credit_transactions
WHERE user_id IN (
    SELECT id FROM auth.users 
    WHERE email != 'admin@example.com'
);

-- Delete all payment transactions for non-admin users  
DELETE FROM payment_transactions
WHERE user_id IN (
    SELECT id FROM auth.users 
    WHERE email != 'admin@example.com'
);

-- Delete all extracted contacts for non-admin users
DELETE FROM extracted_contacts
WHERE user_id IN (
    SELECT id FROM auth.users 
    WHERE email != 'admin@example.com'
);

-- Delete all user credits for non-admin users
DELETE FROM user_credits
WHERE user_id IN (
    SELECT id FROM auth.users 
    WHERE email != 'admin@example.com'
);

-- Finally, delete all non-admin users from auth.users
DELETE FROM auth.users 
WHERE email != 'admin@example.com';

-- Verify only admin remains
SELECT id, email, created_at 
FROM auth.users;
