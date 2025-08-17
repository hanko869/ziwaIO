-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Insert admin and test users
-- Password for admin: admin123 (bcrypt hash)
-- Password for test: test123 (bcrypt hash)
INSERT INTO users (username, password, role, is_active) 
VALUES 
  ('admin', '$2a$10$YourHashHere', 'admin', true),
  ('test', '$2a$10$YourHashHere', 'user', true)
ON CONFLICT (username) DO NOTHING; 