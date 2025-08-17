-- Insert admin user with email
INSERT INTO public.users (username, email, password, role, is_active, created_at)
VALUES (
    'admin', 
    'admin@example.com',
    '$2b$10$whPuSNq021VbnxtRPPlR6Oip0VnjiW0cs9INflpkI5QifbOFjrpDK', 
    'admin', 
    true, 
    NOW()
)
ON CONFLICT (username) DO NOTHING;

-- Insert test user with email
INSERT INTO public.users (username, email, password, role, is_active, created_at)
VALUES (
    'test', 
    'test@example.com',
    '$2b$10$qhVhPyvmkit0fpdxQUAkIekgkCot0HIKAGWH44.MQnT5tBdtBGfRa', 
    'user', 
    true, 
    NOW()
)
ON CONFLICT (username) DO NOTHING;

-- Verify the users were created
SELECT * FROM public.users; 