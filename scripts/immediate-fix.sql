-- Immediate fix: Give credits to ALL users named 'test'
-- This ensures no matter which ID is being used, they have credits

-- First, see all test users
SELECT 'All test users:' as info;
SELECT id, username FROM users WHERE username = 'test';

-- Give 100 credits to ALL test users
INSERT INTO user_credits (user_id, balance, total_purchased, total_used)
SELECT id, 100, 100, 0 
FROM users 
WHERE username = 'test'
ON CONFLICT (user_id) 
DO UPDATE SET 
    balance = 100,
    total_purchased = 100,
    total_used = 0,
    last_updated = CURRENT_TIMESTAMP;

-- Verify credits are assigned
SELECT 'Credits after fix:' as info;
SELECT uc.user_id, uc.balance, u.username 
FROM user_credits uc
JOIN users u ON u.id = uc.user_id
WHERE u.username = 'test';

-- Also check if there are any orphaned credits
SELECT 'Orphaned credits (if any):' as info;
SELECT * FROM user_credits 
WHERE user_id NOT IN (SELECT id FROM users); 