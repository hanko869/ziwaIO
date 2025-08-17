-- Fix the payment_transactions table column name issue
-- The code expects 'amountusdt' but PostgreSQL might have it differently

-- First, check current columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'payment_transactions'
ORDER BY ordinal_position;

-- Drop the table and recreate with exact column names
DROP TABLE IF EXISTS payment_transactions CASCADE;

CREATE TABLE payment_transactions (
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
CREATE INDEX idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX idx_payment_transactions_transaction_hash ON payment_transactions(transaction_hash);

-- Enable RLS
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role access" ON payment_transactions FOR ALL USING (true);

-- Verify the column exists
SELECT 'Column check after recreation:' as info;
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'payment_transactions' 
AND column_name = 'amountusdt'; 