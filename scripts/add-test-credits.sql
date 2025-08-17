-- Manually add credits to test user
-- This simulates what would happen when a payment is confirmed

-- Get the test user's ID
SELECT 'Test user info:' as info;
SELECT id, username FROM users WHERE username = 'test';

-- Add 600 credits (equivalent to 20 USDT payment)
UPDATE user_credits 
SET 
    balance = balance + 600,
    total_purchased = total_purchased + 600,
    last_updated = CURRENT_TIMESTAMP
WHERE user_id = (SELECT id FROM users WHERE username = 'test');

-- Verify the credits were added
SELECT 'Credits after addition:' as info;
SELECT uc.*, u.username 
FROM user_credits uc
JOIN users u ON u.id = uc.user_id
WHERE u.username = 'test';

-- Also create a credit transaction record
INSERT INTO credit_transactions (
    user_id,
    type,
    amount,
    balance_after,
    description,
    metadata
)
SELECT 
    id,
    'purchase',
    600,
    (SELECT balance FROM user_credits WHERE user_id = users.id),
    'Manual credit addition for testing (20 USDT = 600 credits)',
    '{"test": true, "amount_usdt": 20}'::jsonb
FROM users 
WHERE username = 'test'; 