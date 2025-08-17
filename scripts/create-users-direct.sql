-- Create admin user with password 'admin123'
-- This hash is for 'admin123' using bcrypt with 10 rounds
INSERT INTO users (username, password, role, is_active, created_at)
VALUES (
  'admin',
  '$2a$10$kGZvJhQyZMN9BXvPmBdaOu5dDgMiztX4FqYQdZO6HwaMzRpWEGJLO',
  'admin',
  true,
  NOW()
) ON CONFLICT (username) DO NOTHING;

-- Create test user with password 'test123'
-- This hash is for 'test123' using bcrypt with 10 rounds
INSERT INTO users (username, password, role, is_active, created_at)
VALUES (
  'test',
  '$2a$10$YJQaGWyMcZ0PnULLZATA3uRXQTpXvXE2X9cLbfM3vgG3DbGgETuE.',
  'user',
  true,
  NOW()
) ON CONFLICT (username) DO NOTHING;

-- Verify the users were created
SELECT username, role, is_active, created_at FROM users; 