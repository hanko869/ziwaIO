-- Check the payment and add credits manually for payment ID 5211671678
-- Order ID: a2432ea7-9cb8-4330-9deb-9fd1dbf2bb2e_1755461412945
-- Actually paid: 19.9393 USDT (rounded to 20 USDT)

-- First check if user exists
SELECT id, username, email FROM users WHERE id = 'a2432ea7-9cb8-4330-9deb-9fd1dbf2bb2e';

-- Check current credit balance
SELECT * FROM user_credits WHERE user_id = 'a2432ea7-9cb8-4330-9deb-9fd1dbf2bb2e';

-- Add credits for the payment (20 USDT * 30 credits/USDT = 600 credits)
UPDATE user_credits 
SET 
  balance = balance + 600,
  total_purchased = total_purchased + 600,
  last_updated = CURRENT_TIMESTAMP
WHERE user_id = 'a2432ea7-9cb8-4330-9deb-9fd1dbf2bb2e';

-- If user doesn't have credit record, insert one
INSERT INTO user_credits (user_id, balance, total_purchased, total_used)
SELECT 'a2432ea7-9cb8-4330-9deb-9fd1dbf2bb2e', 600, 600, 0
WHERE NOT EXISTS (
  SELECT 1 FROM user_credits WHERE user_id = 'a2432ea7-9cb8-4330-9deb-9fd1dbf2bb2e'
);

-- Record the credit transaction
INSERT INTO credit_transactions (
  user_id,
  type,
  amount,
  balance_after,
  description,
  related_payment_id,
  metadata
) VALUES (
  'a2432ea7-9cb8-4330-9deb-9fd1dbf2bb2e',
  'purchase',
  600,
  (SELECT balance FROM user_credits WHERE user_id = 'a2432ea7-9cb8-4330-9deb-9fd1dbf2bb2e'),
  'Deposited 20 USDT - 600 credits added (Payment ID: 5211671678)',
  '5211671678',
  jsonb_build_object(
    'amountUsdt', 20,
    'creditsPerUsdt', 30,
    'paymentId', '5211671678',
    'status', 'partially_paid',
    'actuallyPaid', 19.9393
  )
);

-- Verify the update
SELECT * FROM user_credits WHERE user_id = 'a2432ea7-9cb8-4330-9deb-9fd1dbf2bb2e';
SELECT * FROM credit_transactions WHERE user_id = 'a2432ea7-9cb8-4330-9deb-9fd1dbf2bb2e' ORDER BY created_at DESC LIMIT 1;
