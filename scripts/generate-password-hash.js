const bcrypt = require('bcryptjs');

async function generateHashes() {
  console.log('Generating password hashes...\n');
  
  // Generate hash for admin123
  const adminHash = await bcrypt.hash('admin123', 10);
  console.log('Password: admin123');
  console.log('Hash:', adminHash);
  console.log('');
  
  // Generate hash for test123
  const testHash = await bcrypt.hash('test123', 10);
  console.log('Password: test123');
  console.log('Hash:', testHash);
  console.log('');
  
  // Generate SQL with the actual hashes
  console.log('Copy and paste this SQL into Supabase SQL editor:\n');
  console.log('-- Create admin user');
  console.log(`INSERT INTO users (username, password, role, is_active, created_at)`);
  console.log(`VALUES ('admin', '${adminHash}', 'admin', true, NOW())`);
  console.log(`ON CONFLICT (username) DO NOTHING;`);
  console.log('');
  console.log('-- Create test user');
  console.log(`INSERT INTO users (username, password, role, is_active, created_at)`);
  console.log(`VALUES ('test', '${testHash}', 'user', true, NOW())`);
  console.log(`ON CONFLICT (username) DO NOTHING;`);
}

generateHashes(); 