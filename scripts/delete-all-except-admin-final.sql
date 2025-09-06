-- DELETE ALL USERS EXCEPT ADMIN (id: b480bd13-94f5-4fba-9b0d-28ea2260c966)

-- First, let's verify what will be deleted
SELECT 'Users to be deleted:' as info;
SELECT id, email FROM auth.users WHERE id != 'b480bd13-94f5-4fba-9b0d-28ea2260c966';

-- Count of users to be deleted
SELECT COUNT(*) as users_to_delete FROM auth.users WHERE id != 'b480bd13-94f5-4fba-9b0d-28ea2260c966';

-- NOW DELETE ALL DATA EXCEPT FOR ADMIN

-- 1. Delete credit transactions
DELETE FROM credit_transactions 
WHERE user_id != 'b480bd13-94f5-4fba-9b0d-28ea2260c966';

-- 2. Delete payment transactions
DELETE FROM payment_transactions 
WHERE user_id != 'b480bd13-94f5-4fba-9b0d-28ea2260c966';

-- 3. Delete extracted contacts
DELETE FROM extracted_contacts 
WHERE user_id != 'b480bd13-94f5-4fba-9b0d-28ea2260c966';

-- 4. Delete user credits
DELETE FROM user_credits 
WHERE user_id != 'b480bd13-94f5-4fba-9b0d-28ea2260c966';

-- 5. Delete from auth.users (all non-admin users)
DELETE FROM auth.users 
WHERE id != 'b480bd13-94f5-4fba-9b0d-28ea2260c966';

-- 6. Keep admin in public.users (no need to delete anything since only admin is there)

-- Verify results
SELECT 'Remaining users in auth.users:' as info;
SELECT id, email FROM auth.users;

SELECT 'Remaining users in public.users:' as info;
SELECT * FROM public.users;

SELECT 'Remaining user credits:' as info;
SELECT * FROM user_credits;
