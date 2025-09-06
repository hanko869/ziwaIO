-- STEP 1: First, let's see ALL users and ALL their columns to understand the structure
SELECT * FROM auth.users;

-- STEP 2: Check if there's a user with email = 'admin'
SELECT * FROM auth.users WHERE email = 'admin';

-- STEP 3: Check if there's any user with 'admin' in any field
SELECT * FROM auth.users 
WHERE email LIKE '%admin%' 
   OR raw_user_meta_data::text LIKE '%admin%';

-- STEP 4: Once you identify your admin user from above, note their email or ID
-- Then use one of these approaches:

-- OPTION A: If your admin is identified by email = 'admin'
-- Count who will be deleted
SELECT COUNT(*) as users_to_delete 
FROM auth.users 
WHERE email != 'admin';

-- See who will be deleted
SELECT id, email, created_at 
FROM auth.users 
WHERE email != 'admin';

-- OPTION B: If your admin is identified by a specific ID (replace 'YOUR_ADMIN_ID' with the actual UUID)
-- Count who will be deleted
SELECT COUNT(*) as users_to_delete 
FROM auth.users 
WHERE id != 'YOUR_ADMIN_ID';

-- See who will be deleted  
SELECT id, email, created_at 
FROM auth.users 
WHERE id != 'YOUR_ADMIN_ID';

-- STEP 5: DELETE QUERIES (use the same WHERE clause as above)
-- Choose OPTION A or B based on how your admin is identified

-- OPTION A: Delete by email
DELETE FROM credit_transactions WHERE user_id IN (SELECT id FROM auth.users WHERE email != 'admin');
DELETE FROM payment_transactions WHERE user_id IN (SELECT id FROM auth.users WHERE email != 'admin');
DELETE FROM extracted_contacts WHERE user_id IN (SELECT id FROM auth.users WHERE email != 'admin');
DELETE FROM user_credits WHERE user_id IN (SELECT id FROM auth.users WHERE email != 'admin');
DELETE FROM auth.users WHERE email != 'admin';

-- OPTION B: Delete by ID (replace 'YOUR_ADMIN_ID')
-- DELETE FROM credit_transactions WHERE user_id IN (SELECT id FROM auth.users WHERE id != 'YOUR_ADMIN_ID');
-- DELETE FROM payment_transactions WHERE user_id IN (SELECT id FROM auth.users WHERE id != 'YOUR_ADMIN_ID');
-- DELETE FROM extracted_contacts WHERE user_id IN (SELECT id FROM auth.users WHERE id != 'YOUR_ADMIN_ID');
-- DELETE FROM user_credits WHERE user_id IN (SELECT id FROM auth.users WHERE id != 'YOUR_ADMIN_ID');
-- DELETE FROM auth.users WHERE id != 'YOUR_ADMIN_ID';

-- Verify result
SELECT * FROM auth.users;
