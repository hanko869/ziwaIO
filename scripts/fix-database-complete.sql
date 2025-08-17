-- First, let's check what columns exist in the users table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- Drop and recreate payment_transactions with correct structure
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
CREATE INDEX idx_payment_transactions_created_at ON public.payment_transactions(created_at);

-- Enable Row Level Security
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Service role has full access to payment_transactions" ON public.payment_transactions
    FOR ALL USING (true);

-- Now let's handle the user_credits table
-- First check if the user already exists
DO $$
BEGIN
    -- Check if user exists
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = '16fd5384-e87d-43f3-ad4b-54cc35f4c452'::uuid) THEN
        -- User doesn't exist, check what columns the users table has
        -- and insert accordingly
        INSERT INTO public.users (id, username, password_hash, role, is_active)
        VALUES (
            '16fd5384-e87d-43f3-ad4b-54cc35f4c452'::uuid,
            'test',
            '$2b$10$qhVhPyvmkit0fpdxQUAkIekgkCot0HIKAGWH44.MQnT5tBdtBGfRa',
            'user',
            true
        );
    END IF;
END $$;

-- Initialize or update user credits
INSERT INTO public.user_credits (user_id, balance, total_purchased, total_used)
VALUES ('16fd5384-e87d-43f3-ad4b-54cc35f4c452'::uuid, 100, 100, 0)
ON CONFLICT (user_id) 
DO UPDATE SET 
    balance = EXCLUDED.balance,
    total_purchased = EXCLUDED.total_purchased,
    last_updated = CURRENT_TIMESTAMP;

-- Verify everything worked
SELECT 'Users table check:' as info;
SELECT id, username, role FROM public.users WHERE username = 'test';

SELECT 'User credits check:' as info;
SELECT * FROM public.user_credits WHERE user_id = '16fd5384-e87d-43f3-ad4b-54cc35f4c452'::uuid;

SELECT 'Payment transactions table columns:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'payment_transactions' 
ORDER BY ordinal_position; 