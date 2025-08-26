const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

async function setupExtractionSessions() {
  try {
    console.log('Setting up extraction sessions table...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'create-extraction-sessions-table.sql');
    const sql = await fs.readFile(sqlPath, 'utf8');
    
    // Execute the SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        query: sql
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to execute SQL:', error);
      
      // Try alternative approach - execute through Supabase client
      console.log('\nTrying alternative approach...');
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Note: Supabase doesn't have a direct SQL execution method,
      // so we'll need to manually create the table through the dashboard
      console.log('\nPlease run the following SQL in your Supabase SQL Editor:');
      console.log('----------------------------------------');
      console.log(sql);
      console.log('----------------------------------------');
      
    } else {
      console.log('✅ Extraction sessions table created successfully!');
    }
    
  } catch (error) {
    console.error('Error setting up extraction sessions:', error);
    
    console.log('\n⚠️  Please manually run the SQL in scripts/create-extraction-sessions-table.sql');
    console.log('   in your Supabase SQL Editor dashboard.');
  }
}

setupExtractionSessions();
