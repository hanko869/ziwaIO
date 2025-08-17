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

-- Create index on email for faster lookups  
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists and create new one
DROP POLICY IF EXISTS "Service role has full access to users" ON public.users;
CREATE POLICY "Service role has full access to users" ON public.users
    FOR ALL USING (true);

-- Insert admin user
INSERT INTO public.users (username, email, password_hash, role, is_active)
VALUES (
    'admin',
    'admin@example.com', 
    '$2b$10$whPuSNq021VbnxtRPPlR6Oip0VnjiW0cs9INflpkI5QifbOFjrpDK',
    'admin',
    true
)
ON CONFLICT (username) DO NOTHING;

-- Insert test user  
INSERT INTO public.users (username, email, password_hash, role, is_active)
VALUES (
    'test',
    'test@example.com',
    '$2b$10$qhVhPyvmkit0fpdxQUAkIekgkCot0HIKAGWH44.MQnT5tBdtBGfRa',
    'user', 
    true
)
ON CONFLICT (username) DO NOTHING;

-- Verify the users were created
SELECT * FROM public.users; 