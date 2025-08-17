-- Drop the existing payment_transactions table if it exists
DROP TABLE IF EXISTS public.payment_transactions CASCADE;

-- Create payment_transactions table with correct column names
-- Using snake_case for all columns to match Supabase conventions
CREATE TABLE public.payment_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    transaction_hash VARCHAR(255) NOT NULL UNIQUE,
    from_address VARCHAR(255) NOT NULL,
    to_address VARCHAR(255) NOT NULL,
    amountusdt DECIMAL(18,6) NOT NULL,
    credits_purchased INTEGER NOT NULL,
    credits_per_usdt INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'confirmed', 'failed')),
    confirmations INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB
);

-- Create indexes
CREATE INDEX idx_payment_transactions_user_id ON public.payment_transactions(user_id);
CREATE INDEX idx_payment_transactions_transaction_hash ON public.payment_transactions(transaction_hash);
CREATE INDEX idx_payment_transactions_created_at ON public.payment_transactions(created_at);

-- Enable Row Level Security
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- Create policy for service role access
CREATE POLICY "Service role has full access to payment_transactions" ON public.payment_transactions
    FOR ALL USING (true);

-- Also fix the user_credits table issue
-- First, let's ensure the user exists
INSERT INTO public.users (id, username, password_hash, role, is_active, created_at, last_login)
VALUES (
    '16fd5384-e87d-43f3-ad4b-54cc35f4c452'::uuid,
    'test',
    '$2b$10$qhVhPyvmkit0fpdxQUAkIekgkCot0HIKAGWH44.MQnT5tBdtBGfRa',
    'user',
    true,
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Then initialize user credits for this user
INSERT INTO public.user_credits (user_id, balance, total_purchased, total_used)
VALUES ('16fd5384-e87d-43f3-ad4b-54cc35f4c452'::uuid, 100, 100, 0)
ON CONFLICT (user_id) 
DO UPDATE SET balance = 100, total_purchased = 100;

-- Verify the tables
SELECT 'payment_transactions columns:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'payment_transactions' 
ORDER BY ordinal_position;

SELECT 'user_credits data:' as info;
SELECT * FROM public.user_credits; 