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

async function createUsers() {
  try {
    // Users to create
    const users = [
      { username: 'admin', password: 'admin123', role: 'admin' },
      { username: 'test', password: 'test123', role: 'user' }
    ];
    
    for (const user of users) {
      // Check if user already exists
      const { data: existing } = await supabase
        .from('users')
        .select('username')
        .eq('username', user.username)
        .single();
      
      if (existing) {
        console.log(`User ${user.username} already exists, skipping...`);
        continue;
      }
      
      // Hash the password
      const hashedPassword = await bcrypt.hash(user.password, 10);
      
      // Create user
      const { data, error } = await supabase
        .from('users')
        .insert({
          username: user.username,
          password: hashedPassword,
          role: user.role,
          is_active: true
        })
        .select()
        .single();
      
      if (error) {
        console.error(`Error creating user ${user.username}:`, error);
        continue;
      }
      
      console.log(`\nUser created successfully!`);
      console.log(`Username: ${user.username}`);
      console.log(`Password: ${user.password}`);
      console.log(`Role: ${user.role}`);
      console.log(`User ID: ${data.id}`);
    }
    
    console.log('\n✅ User creation complete!');
    console.log('\nYou can now login with:');
    console.log('Admin: username=admin, password=admin123');
    console.log('Test User: username=test, password=test123');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

createUsers(); 