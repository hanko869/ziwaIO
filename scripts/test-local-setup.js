const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Get Supabase config from environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Testing local setup...');
console.log('Supabase URL:', supabaseUrl);
console.log('Has Service Key:', !!supabaseKey);

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSetup() {
  try {
    // Test connection
    console.log('\n1. Testing database connection...');
    const { data: tables, error: tablesError } = await supabase
      .from('users')
      .select('count');
    
    if (tablesError) {
      console.error('Database connection error:', tablesError.message);
      console.log('\nThe users table might not exist. Run the setup-database.sql script in Supabase first.');
      return;
    }
    
    console.log('✅ Database connection successful');
    
    // Check existing users
    console.log('\n2. Checking existing users...');
    const { data: existingUsers, error: fetchError } = await supabase
      .from('users')
      .select('username, email, role, is_active');
    
    if (fetchError) {
      console.error('Error fetching users:', fetchError);
      return;
    }
    
    console.log('Current users:', existingUsers || []);
    
    // Try to create admin user
    console.log('\n3. Creating admin user...');
    const { data: adminData, error: adminError } = await supabase
      .from('users')
      .insert({
        username: 'admin',
        email: 'admin@example.com',
        password_hash: '$2b$10$whPuSNq021VbnxtRPPlR6Oip0VnjiW0cs9INflpkI5QifbOFjrpDK',
        role: 'admin',
        is_active: true
      })
      .select();
    
    if (adminError) {
      if (adminError.code === '23505') {
        console.log('ℹ️  Admin user already exists');
      } else {
        console.error('Error creating admin:', adminError);
      }
    } else {
      console.log('✅ Admin user created:', adminData);
    }
    
    // Try to create test user
    console.log('\n4. Creating test user...');
    const { data: testData, error: testError } = await supabase
      .from('users')
      .insert({
        username: 'test',
        email: 'test@example.com',
        password_hash: '$2b$10$qhVhPyvmkit0fpdxQUAkIekgkCot0HIKAGWH44.MQnT5tBdtBGfRa',
        role: 'user',
        is_active: true
      })
      .select();
    
    if (testError) {
      if (testError.code === '23505') {
        console.log('ℹ️  Test user already exists');
      } else {
        console.error('Error creating test user:', testError);
      }
    } else {
      console.log('✅ Test user created:', testData);
    }
    
    // Final check
    console.log('\n5. Final user list:');
    const { data: finalUsers, error: finalError } = await supabase
      .from('users')
      .select('username, email, role, is_active, created_at');
    
    if (finalError) {
      console.error('Error fetching final users:', finalError);
    } else {
      console.table(finalUsers);
    }
    
    console.log('\n✅ Setup complete! You can now test login with:');
    console.log('   Admin: username "admin", password "admin123"');
    console.log('   User:  username "test", password "test123"');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testSetup(); 