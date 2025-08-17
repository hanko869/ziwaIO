-- First, check what tables exist
SELECT table_schema, table_name 
FROM information_schema.tables 
WHERE table_name = 'users';

-- Check the structure of the public.users table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'users';

-- If your users table has different columns (like email instead of username),
-- you might need to create the table first:
CREATE TABLE IF NOT EXISTS public.users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Now insert the users
INSERT INTO public.users (username, password, role, is_active, created_at)
VALUES 
    ('admin', '$2b$10$whPuSNq021VbnxtRPPlR6Oip0VnjiW0cs9INflpkI5QifbOFjrpDK', 'admin', true, NOW()),
    ('test', '$2b$10$qhVhPyvmkit0fpdxQUAkIekgkCot0HIKAGWH44.MQnT5tBdtBGfRa', 'user', true, NOW())
ON CONFLICT (username) DO NOTHING;

-- Verify the users were created
SELECT * FROM public.users; 