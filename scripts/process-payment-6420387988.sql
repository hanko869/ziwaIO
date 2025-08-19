-- Script to manually process payment 6420387988
-- Payment details:
-- - Payment ID: 6420387988
-- - Order ID: b45529c4-0c90-4798-9c37-5036e6b9f72c_17556231656156
-- - Requested: 13.163344 USDT
-- - Actually paid: 13.1633 USDT (99.9997% - should be accepted)
-- - Status: Partially_paid
-- - User ID: b45529c4-0c90-4798-9c37-5036e6b9f72c
-- - Expected credits: 360 (12 USDT * 30)

-- First, check if payment already exists
SELECT * FROM payment_transactions 
WHERE payment_id = '6420387988';

-- Check user's current credit balance
SELECT * FROM user_credits 
WHERE user_id = 'b45529c4-0c90-4798-9c37-5036e6b9f72c';

-- If payment not already processed, add it
-- Note: Run this only if the payment doesn't exist in payment_transactions
INSERT INTO payment_transactions (
    id,
    user_id,
    payment_id,
    amount,
    credits_added,
    status,
    created_at
) VALUES (
    gen_random_uuid(),
    'b45529c4-0c90-4798-9c37-5036e6b9f72c',
    '6420387988',
    12.00,  -- Original order amount in USDT
    360,    -- 12 * 30 credits
    'completed',
    NOW()
);

-- Update user credits (adds to existing balance)
UPDATE user_credits
SET 
    balance = balance + 360,
    updated_at = NOW()
WHERE user_id = 'b45529c4-0c90-4798-9c37-5036e6b9f72c';

-- If user doesn't have a credit record yet, create one
INSERT INTO user_credits (user_id, balance, created_at, updated_at)
VALUES ('b45529c4-0c90-4798-9c37-5036e6b9f72c', 360, NOW(), NOW())
ON CONFLICT (user_id) DO NOTHING;

-- Add credit transaction record
INSERT INTO credit_transactions (
    id,
    user_id,
    amount,
    type,
    description,
    created_at
) VALUES (
    gen_random_uuid(),
    'b45529c4-0c90-4798-9c37-5036e6b9f72c',
    360,
    'credit',
    'Payment 6420387988 - Deposit 12 USDT (manually processed - partial payment 99.9997%)',
    NOW()
);

-- Verify the results
SELECT 'Current credit balance:' as info, balance FROM user_credits 
WHERE user_id = 'b45529c4-0c90-4798-9c37-5036e6b9f72c';

SELECT 'Payment record:' as info, * FROM payment_transactions 
WHERE payment_id = '6420387988';
