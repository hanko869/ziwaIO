-- Fix the user ID mismatch issue
-- The auth token has user ID: 16fd5384-e87d-43f3-ad4b-54cc35f4c452
-- But the actual test user in DB has ID: e0428e44-0151-41bd-84f8-f44e470b7c5a

-- First, let's see the current state
SELECT 'Current users:' as info;
SELECT id, username FROM users WHERE username = 'test';

SELECT 'Current user_credits:' as info;
SELECT * FROM user_credits;

-- Delete the credits for the non-existent user
DELETE FROM user_credits WHERE user_id = '16fd5384-e87d-43f3-ad4b-54cc35f4c452'::uuid;

-- Add credits for the actual test user
INSERT INTO user_credits (user_id, balance, total_purchased, total_used)
VALUES ('e0428e44-0151-41bd-84f8-f44e470b7c5a'::uuid, 100, 100, 0)
ON CONFLICT (user_id) 
DO UPDATE SET 
    balance = 100,
    total_purchased = 100,
    total_used = 0,
    last_updated = CURRENT_TIMESTAMP;

-- Verify the fix
SELECT 'After fix - user_credits:' as info;
SELECT uc.*, u.username 
FROM user_credits uc
JOIN users u ON u.id = uc.user_id; 