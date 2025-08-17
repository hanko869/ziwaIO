const { createClient } = require('@supabase/supabase-js');

// Using the correct Supabase project from Vercel environment
const supabaseUrl = 'https://olmyatnzzkjdceyjqiqi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sbXlhdG56emtqZGNleWpxaXFpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTk1Mjc1NCwiZXhwIjoyMDY3NTI4NzU0fQ.jayj7GpprG1gpiFgI5C8j9rdzke-zAETcdt_FQpkTkI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createUsers() {
  try {
    console.log('Creating users in the correct Supabase database...');
    
    // Insert admin user
    const { data: adminData, error: adminError } = await supabase
      .from('users')
      .insert({
        username: 'admin',
        email: 'admin@example.com',
        password_hash: '$2b$10$whPuSNq021VbnxtRPPlR6Oip0VnjiW0cs9INflpkI5QifbOFjrpDK',
        role: 'admin',
        is_active: true,
        created_at: new Date().toISOString()
      })
      .select();

    if (adminError) {
      console.error('Error inserting admin user:', adminError);
    } else {
      console.log('Admin user created successfully:', adminData);
    }

    // Insert test user
    const { data: testData, error: testError } = await supabase
      .from('users')
      .insert({
        username: 'test',
        email: 'test@example.com',
        password_hash: '$2b$10$qhVhPyvmkit0fpdxQUAkIekgkCot0HIKAGWH44.MQnT5tBdtBGfRa',
        role: 'user',
        is_active: true,
        created_at: new Date().toISOString()
      })
      .select();

    if (testError) {
      console.error('Error inserting test user:', testError);
    } else {
      console.log('Test user created successfully:', testData);
    }

    // Verify users
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('*');

    if (fetchError) {
      console.error('Error fetching users:', fetchError);
    } else {
      console.log('\nAll users in database:');
      console.table(users);
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }

  process.exit(0);
}

createUsers(); 