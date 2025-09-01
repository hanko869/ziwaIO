require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function investigateExtractionLoss() {
  console.log('=== INVESTIGATING EXTRACTION LOSS ===\n');
  
  try {
    // 1. Get extraction sessions to see failure patterns
    console.log('1. Checking extraction sessions...');
    const { data: sessions, error: sessionsError } = await supabase
      .from('extraction_sessions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
      
    if (sessions && sessions.length > 0) {
      console.log(`Found ${sessions.length} recent extraction sessions:\n`);
      
      sessions.forEach(session => {
        const totalUrls = session.total_urls || 0;
        const processed = session.processed_urls || 0;
        const successful = session.successful_extractions || 0;
        const failed = session.failed_extractions || 0;
        const successRate = totalUrls > 0 ? ((successful / totalUrls) * 100).toFixed(1) : 0;
        
        console.log(`Session ${session.id.substring(0, 8)}... (${session.created_at})`);
        console.log(`  Total URLs: ${totalUrls}`);
        console.log(`  Processed: ${processed}`);
        console.log(`  Successful: ${successful} (${successRate}%)`);
        console.log(`  Failed: ${failed}`);
        console.log(`  Status: ${session.status}`);
        
        // Check if session has detailed results
        if (session.results && Array.isArray(session.results)) {
          const failedResults = session.results.filter(r => !r.success);
          if (failedResults.length > 0) {
            console.log(`  Failed URLs sample:`);
            failedResults.slice(0, 3).forEach(r => {
              console.log(`    - ${r.url}: ${r.error}`);
            });
          }
        }
        console.log('');
      });
    }
    
    // 2. Analyze error patterns in activities
    console.log('\n2. Analyzing activity error patterns...');
    const { data: failedActivities } = await supabase
      .from('activities')
      .select('*')
      .eq('action', 'extract_contact')
      .eq('success', false)
      .order('timestamp', { ascending: false })
      .limit(50);
      
    if (failedActivities && failedActivities.length > 0) {
      const errorTypes = {};
      failedActivities.forEach(activity => {
        const details = activity.details || 'Unknown error';
        errorTypes[details] = (errorTypes[details] || 0) + 1;
      });
      
      console.log('Error type distribution:');
      Object.entries(errorTypes)
        .sort((a, b) => b[1] - a[1])
        .forEach(([error, count]) => {
          console.log(`  - "${error}": ${count} times`);
        });
    }
    
    // 3. Check credit transaction patterns
    console.log('\n3. Checking credit transaction patterns...');
    const { data: recentTransactions } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('type', 'usage')
      .order('created_at', { ascending: false })
      .limit(20);
      
    if (recentTransactions) {
      // Look for patterns in descriptions
      const singleExtractions = recentTransactions.filter(t => t.description?.includes('single_extraction'));
      const bulkExtractions = recentTransactions.filter(t => t.description?.includes('bulk_extraction'));
      
      console.log(`Recent transactions: ${singleExtractions.length} single, ${bulkExtractions.length} bulk`);
      
      // Check for bulk extractions with low credit usage (might indicate failures)
      bulkExtractions.forEach(t => {
        const credits = Math.abs(t.amount);
        console.log(`  Bulk extraction: ${credits} credits - ${t.description}`);
      });
    }
    
    // 4. Sample recent extractions to check data quality
    console.log('\n4. Checking recent extraction data quality...');
    const { data: recentExtractions } = await supabase
      .from('extracted_contacts')
      .select('linkedin_url, name, emails, phones, credits_used')
      .order('extracted_at', { ascending: false })
      .limit(20);
      
    if (recentExtractions) {
      let noEmailCount = 0;
      let noPhoneCount = 0;
      let noContactCount = 0;
      
      recentExtractions.forEach(e => {
        const hasEmail = e.emails && e.emails.length > 0;
        const hasPhone = e.phones && e.phones.length > 0;
        
        if (!hasEmail) noEmailCount++;
        if (!hasPhone) noPhoneCount++;
        if (!hasEmail && !hasPhone) noContactCount++;
      });
      
      console.log(`Out of ${recentExtractions.length} recent extractions:`);
      console.log(`  - ${noEmailCount} have no emails (${(noEmailCount/recentExtractions.length*100).toFixed(1)}%)`);
      console.log(`  - ${noPhoneCount} have no phones (${(noPhoneCount/recentExtractions.length*100).toFixed(1)}%)`);
      console.log(`  - ${noContactCount} have no contact info at all (${(noContactCount/recentExtractions.length*100).toFixed(1)}%)`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

investigateExtractionLoss();
