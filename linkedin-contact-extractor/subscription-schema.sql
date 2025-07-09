-- LinkedIn Contact Extractor Subscription Schema
-- This schema supports credit-based subscriptions with TRC-20 payments

-- Users table with subscription information
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    wallet_address VARCHAR(42), -- TRON wallet address if provided
    language VARCHAR(10) DEFAULT 'en'
);

-- User credits table
CREATE TABLE IF NOT EXISTS user_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    balance INTEGER NOT NULL DEFAULT 0,
    total_purchased INTEGER NOT NULL DEFAULT 0,
    total_used INTEGER NOT NULL DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Pricing configuration (pay-as-you-go)
CREATE TABLE IF NOT EXISTS pricing_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    credits_per_email INTEGER NOT NULL DEFAULT 2,
    credits_per_phone INTEGER NOT NULL DEFAULT 5,
    credits_per_usdt INTEGER NOT NULL DEFAULT 10,
    min_deposit_usdt DECIMAL(10, 2) NOT NULL DEFAULT 10.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Payment transactions
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    transaction_hash VARCHAR(64) UNIQUE NOT NULL,
    from_address VARCHAR(42) NOT NULL,
    to_address VARCHAR(42) NOT NULL,
    amount_usdt DECIMAL(10, 2) NOT NULL,
    credits_purchased INTEGER NOT NULL,
    credits_per_usdt INTEGER NOT NULL, -- Rate at time of purchase
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, confirmed, failed
    confirmations INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB
);

-- Credit transactions (usage history)
CREATE TABLE IF NOT EXISTS credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'purchase', 'usage', 'refund', 'bonus'
    amount INTEGER NOT NULL, -- positive for credits added, negative for used
    balance_after INTEGER NOT NULL,
    description TEXT,
    related_payment_id UUID REFERENCES payment_transactions(id),
    metadata JSONB, -- Store extraction details, LinkedIn URLs, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Extracted contacts (now linked to users)
CREATE TABLE IF NOT EXISTS extracted_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    linkedin_url TEXT NOT NULL,
    name VARCHAR(255),
    emails TEXT[], -- Array of emails
    phones TEXT[], -- Array of phones
    job_title VARCHAR(255),
    company VARCHAR(255),
    location VARCHAR(255),
    education TEXT,
    credits_used INTEGER DEFAULT 0, -- Calculated based on results
    email_credits INTEGER DEFAULT 0, -- Credits charged for emails
    phone_credits INTEGER DEFAULT 0, -- Credits charged for phones
    extracted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    raw_data JSONB -- Store complete API response
);

-- Webhook logs for payment tracking
CREATE TABLE IF NOT EXISTS webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX idx_payment_transactions_hash ON payment_transactions(transaction_hash);
CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX idx_extracted_contacts_user_id ON extracted_contacts(user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for users table
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default pricing configuration
-- Pay-as-you-go model: Users deposit any amount and pay per result
-- Wiza costs: Email = 2 credits × $0.0045 = $0.009, Phone = 5 credits × $0.0045 = $0.0225
-- Our pricing for 3x ROI: Email = $0.027, Phone = $0.0675, Total = $0.0945 ≈ $0.10
INSERT INTO pricing_config (name, credits_per_email, credits_per_phone, credits_per_usdt, min_deposit_usdt) VALUES
    ('default', 1, 2, 30, 10.00);

-- Note: With 30 credits per USDT:
-- Email extraction: 1 credit = $0.033 (3.7x ROI on $0.009 cost)
-- Phone extraction: 2 credits = $0.067 (3x ROI on $0.0225 cost)
-- Full extraction (email + phone): 3 credits = $0.10 (3.17x ROI on $0.0315 cost)

-- Create view for user credit summary
CREATE VIEW user_credit_summary AS
SELECT 
    u.id,
    u.email,
    uc.balance as current_credits,
    uc.total_purchased,
    uc.total_used,
    COUNT(DISTINCT ec.id) as total_extractions,
    MAX(ec.extracted_at) as last_extraction
FROM users u
LEFT JOIN user_credits uc ON u.id = uc.user_id
LEFT JOIN extracted_contacts ec ON u.id = ec.user_id
GROUP BY u.id, u.email, uc.balance, uc.total_purchased, uc.total_used; 