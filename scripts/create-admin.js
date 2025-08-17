const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please check your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdminUser() {
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Create admin user
    const { data, error } = await supabase
      .from('users')
      .insert({
        username: 'admin',
        password: hashedPassword,
        role: 'admin',
        is_active: true
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating admin user:', error);
      return;
    }
    
    console.log('Admin user created successfully!');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('User ID:', data.id);
  } catch (error) {
    console.error('Error:', error);
  }
}

createAdminUser(); 