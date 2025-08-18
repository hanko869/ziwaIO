-- Add credits for payment ID 5591298191
-- Order ID: a4f7b0b-2b2fc-4ad1-aad7-ffc91c022e97_1755464448941
-- Amount sent: 21.958038 USDT (user paid 20 * 1.20 = 24 USDT)
-- Amount received: 18.143729 USDT
-- Original deposit amount: 20 USDT (we remove the 20% markup)

-- Extract user ID from order_id
-- User ID: a4f7b0b-2b2fc-4ad1-aad7-ffc91c022e97

-- First check if user exists and current balance
SELECT id, username, email FROM users WHERE id = 'a4f7b0b-2b2fc-4ad1-aad7-ffc91c022e97';
SELECT * FROM user_credits WHERE user_id = 'a4f7b0b-2b2fc-4ad1-aad7-ffc91c022e97';

-- Add 600 credits for the 20 USDT deposit (20 * 30 = 600)
UPDATE user_credits 
SET 
  balance = balance + 600,
  total_purchased = total_purchased + 600,
  last_updated = CURRENT_TIMESTAMP
WHERE user_id = 'a4f7b0b-2b2fc-4ad1-aad7-ffc91c022e97';

-- If user doesn't have credit record, insert one
INSERT INTO user_credits (user_id, balance, total_purchased, total_used)
SELECT 'a4f7b0b-2b2fc-4ad1-aad7-ffc91c022e97', 600, 600, 0
WHERE NOT EXISTS (
  SELECT 1 FROM user_credits WHERE user_id = 'a4f7b0b-2b2fc-4ad1-aad7-ffc91c022e97'
);

-- Record the credit transaction
INSERT INTO credit_transactions (
  user_id,
  type,
  amount,
  balance_after,
  description,
  metadata
) VALUES (
  'a4f7b0b-2b2fc-4ad1-aad7-ffc91c022e97',
  'purchase',
  600,
  (SELECT balance FROM user_credits WHERE user_id = 'a4f7b0b-2b2fc-4ad1-aad7-ffc91c022e97'),
  'Deposited 20 USDT - 600 credits added (Payment ID: 5591298191)',
  jsonb_build_object(
    'amountUsdt', 20,
    'creditsPerUsdt', 30,
    'paymentId', '5591298191'::text,
    'status', 'partially_paid',
    'amountSent', 21.958038,
    'amountReceived', 18.143729
  )
);

-- Verify the update
SELECT * FROM user_credits WHERE user_id = 'a4f7b0b-2b2fc-4ad1-aad7-ffc91c022e97';
SELECT * FROM credit_transactions 
WHERE user_id = 'a4f7b0b-2b2fc-4ad1-aad7-ffc91c022e97' 
ORDER BY created_at DESC 
LIMIT 1;
