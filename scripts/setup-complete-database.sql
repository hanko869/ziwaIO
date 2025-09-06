-- Complete Database Setup for LinkedIn Contact Extractor
-- Run this script in your Supabase SQL Editor

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    wallet_address VARCHAR(255),
    language VARCHAR(10) DEFAULT 'en'
);

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists and create new one
DROP POLICY IF EXISTS "Service role has full access to users" ON public.users;
CREATE POLICY "Service role has full access to users" ON public.users
    FOR ALL USING (true);

-- Create activities table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    username VARCHAR(255) NOT NULL,
    action VARCHAR(50) NOT NULL,
    details TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    linkedin_url TEXT,
    contact_name VARCHAR(255),
    success BOOLEAN DEFAULT true
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON public.activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_timestamp ON public.activities(timestamp);

-- Enable Row Level Security
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists and create new one
DROP POLICY IF EXISTS "Service role has full access to activities" ON public.activities;
CREATE POLICY "Service role has full access to activities" ON public.activities
    FOR ALL USING (true);

-- Create contacts table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    title VARCHAR(255),
    company VARCHAR(255),
    emails TEXT[],
    phones TEXT[],
    linkedin_url TEXT,
    extracted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for contacts
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON public.contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_extracted_at ON public.contacts(extracted_at);

-- Enable Row Level Security
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists and create new one
DROP POLICY IF EXISTS "Service role has full access to contacts" ON public.contacts;
CREATE POLICY "Service role has full access to contacts" ON public.contacts
    FOR ALL USING (true);

-- Create user_credits table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_credits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    balance INTEGER DEFAULT 0,
    total_purchased INTEGER DEFAULT 0,
    total_used INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Create index on user_id
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON public.user_credits(user_id);

-- Enable Row Level Security
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists and create new one
DROP POLICY IF EXISTS "Service role has full access to user_credits" ON public.user_credits;
CREATE POLICY "Service role has full access to user_credits" ON public.user_credits
    FOR ALL USING (true);

-- Create credit_transactions table
CREATE TABLE IF NOT EXISTS public.credit_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('purchase', 'usage', 'refund', 'bonus')),
    amount INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    description TEXT,
    related_payment_id UUID,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON public.credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON public.credit_transactions(created_at);

-- Enable Row Level Security
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists and create new one
DROP POLICY IF EXISTS "Service role has full access to credit_transactions" ON public.credit_transactions;
CREATE POLICY "Service role has full access to credit_transactions" ON public.credit_transactions
    FOR ALL USING (true);

-- Create payment_transactions table with correct column names
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    transaction_hash VARCHAR(255) NOT NULL UNIQUE,
    from_address VARCHAR(255) NOT NULL,
    to_address VARCHAR(255) NOT NULL,
    amountUsdt DECIMAL(18,6) NOT NULL,
    credits_purchased INTEGER NOT NULL,
    credits_per_usdt INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'confirmed', 'failed')),
    confirmations INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON public.payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_transaction_hash ON public.payment_transactions(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON public.payment_transactions(created_at);

-- Enable Row Level Security
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists and create new one
DROP POLICY IF EXISTS "Service role has full access to payment_transactions" ON public.payment_transactions;
CREATE POLICY "Service role has full access to payment_transactions" ON public.payment_transactions
    FOR ALL USING (true);

-- Create extraction_sessions table for tracking bulk extractions
CREATE TABLE IF NOT EXISTS public.extraction_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    session_id VARCHAR(255) NOT NULL,
    urls_count INTEGER NOT NULL,
    completed_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for extraction sessions
CREATE INDEX IF NOT EXISTS idx_extraction_sessions_user_id ON public.extraction_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_extraction_sessions_session_id ON public.extraction_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_extraction_sessions_created_at ON public.extraction_sessions(created_at);

-- Enable Row Level Security
ALTER TABLE public.extraction_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists and create new one
DROP POLICY IF EXISTS "Service role has full access to extraction_sessions" ON public.extraction_sessions;
CREATE POLICY "Service role has full access to extraction_sessions" ON public.extraction_sessions
    FOR ALL USING (true);

-- Remove any existing admin users
DELETE FROM public.users WHERE username = 'admin' OR username = 'rag26';

-- Insert admin user with your credentials
-- Password: Qq221122?@ (hashed with bcrypt)
INSERT INTO public.users (username, email, password_hash, role, is_active)
VALUES (
    'rag26',
    'admin@ziwa.io', 
    '$2b$10$Coc6fkGZmXIMCgfVSYYyaeASwrvbs/y/a25IaOzA8UcLDtFEsyt.O',
    'admin',
    true
);

-- Get the admin user ID for credit initialization
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    SELECT id INTO admin_user_id FROM public.users WHERE username = 'rag26';
    
    -- Initialize credits for admin user (1000 credits)
    INSERT INTO public.user_credits (user_id, balance, total_purchased, total_used)
    VALUES (admin_user_id, 1000, 1000, 0)
    ON CONFLICT (user_id) DO UPDATE SET
        balance = 1000,
        total_purchased = 1000,
        last_updated = CURRENT_TIMESTAMP;
        
    -- Log the admin creation
    INSERT INTO public.activities (user_id, username, action, details)
    VALUES (admin_user_id, 'rag26', 'admin_created', 'Admin account created during database setup');
END $$;

-- Verify setup
SELECT 
    'Users' as table_name, 
    COUNT(*) as count 
FROM public.users
UNION ALL
SELECT 
    'Activities' as table_name, 
    COUNT(*) as count 
FROM public.activities
UNION ALL
SELECT 
    'Contacts' as table_name, 
    COUNT(*) as count 
FROM public.contacts
UNION ALL
SELECT 
    'User Credits' as table_name, 
    COUNT(*) as count 
FROM public.user_credits
UNION ALL
SELECT 
    'Credit Transactions' as table_name, 
    COUNT(*) as count 
FROM public.credit_transactions
UNION ALL
SELECT 
    'Payment Transactions' as table_name, 
    COUNT(*) as count 
FROM public.payment_transactions
UNION ALL
SELECT 
    'Extraction Sessions' as table_name, 
    COUNT(*) as count 
FROM public.extraction_sessions;

-- Show admin user details
SELECT username, email, role, is_active, created_at FROM public.users WHERE role = 'admin';