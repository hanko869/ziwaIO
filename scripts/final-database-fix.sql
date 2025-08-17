-- Step 1: Check current users table structure
SELECT 'Current users table structure:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- Step 2: Drop and recreate payment_transactions table
DROP TABLE IF EXISTS public.payment_transactions CASCADE;

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

-- Enable RLS
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role access" ON public.payment_transactions FOR ALL USING (true);

-- Step 3: Check if test user exists and get their ID
SELECT 'Checking for test user:' as info;
SELECT id, username FROM public.users WHERE username = 'test';

-- Step 4: Initialize user_credits for the test user
-- Use the existing user ID from the users table
INSERT INTO public.user_credits (user_id, balance, total_purchased, total_used)
SELECT id, 100, 100, 0 
FROM public.users 
WHERE username = 'test'
ON CONFLICT (user_id) 
DO UPDATE SET 
    balance = 100,
    total_purchased = 100,
    total_used = 0,
    last_updated = CURRENT_TIMESTAMP;

-- Step 5: Verify everything
SELECT 'User credits for test user:' as info;
SELECT uc.*, u.username 
FROM public.user_credits uc
JOIN public.users u ON u.id = uc.user_id
WHERE u.username = 'test';

SELECT 'Payment transactions table ready:' as info;
SELECT COUNT(*) as column_count 
FROM information_schema.columns 
WHERE table_name = 'payment_transactions';

-- Step 6: Show all tables are ready
SELECT 'All required tables:' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'user_credits', 'payment_transactions', 'credit_transactions', 'activities')
ORDER BY table_name; 