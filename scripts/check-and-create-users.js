const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local file
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please check your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTableAndCreateUsers() {
  try {
    console.log('Checking users table structure...');
    
    // First, let's see what columns exist in the users table
    const { data: tableInfo, error: tableError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('Error checking table:', tableError);
      console.log('\n❌ The users table might not exist or has issues.');
      console.log('\nPlease run this SQL in your Supabase SQL editor:');
      console.log(`
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);
      `);
      return;
    }
    
    // If we get here, table exists. Let's create users
    console.log('✅ Users table exists. Creating users...\n');
    
    // Generate password hashes
    const adminHash = await bcrypt.hash('admin123', 10);
    const testHash = await bcrypt.hash('test123', 10);
    
    // Try to insert admin user
    const { data: adminData, error: adminError } = await supabase
      .from('users')
      .insert({
        username: 'admin',
        password: adminHash,
        role: 'admin',
        is_active: true
      })
      .select()
      .single();
    
    if (adminError) {
      if (adminError.code === '23505') {
        console.log('Admin user already exists.');
      } else {
        console.error('Error creating admin:', adminError.message);
        console.log('\n⚠️  Your users table might be missing the password column.');
        console.log('Please add it using this SQL in Supabase:');
        console.log('ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255);');
      }
    } else {
      console.log('✅ Admin user created successfully!');
      console.log('   Username: admin');
      console.log('   Password: admin123');
    }
    
    // Try to insert test user
    const { data: testData, error: testError } = await supabase
      .from('users')
      .insert({
        username: 'test',
        password: testHash,
        role: 'user',
        is_active: true
      })
      .select()
      .single();
    
    if (testError) {
      if (testError.code === '23505') {
        console.log('Test user already exists.');
      } else {
        console.error('Error creating test user:', testError.message);
      }
    } else {
      console.log('✅ Test user created successfully!');
      console.log('   Username: test');
      console.log('   Password: test123');
    }
    
    console.log('\n🎉 Setup complete!');
    console.log('\nYou can now login at https://ziwa.pro/login with:');
    console.log('• Admin: username=admin, password=admin123');
    console.log('• Test User: username=test, password=test123');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  } finally {
    process.exit(0);
  }
}

checkTableAndCreateUsers(); 