require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTimeoutIssues() {
  console.log('=== CHECKING FOR DROPPED URLs AND TIMEOUT ISSUES ===\n');
  
  try {
    // 1. Check extraction sessions for incomplete processing
    console.log('1. Checking extraction sessions for incomplete processing...');
    const { data: sessions } = await supabase
      .from('extraction_sessions')
      .select('*')
      .in('status', ['in_progress', 'failed', 'completed'])
      .order('created_at', { ascending: false })
      .limit(20);
      
    if (sessions && sessions.length > 0) {
      console.log(`Found ${sessions.length} extraction sessions:\n`);
      
      let totalDropped = 0;
      sessions.forEach(session => {
        const totalUrls = session.total_urls || 0;
        const processed = session.processed_urls || 0;
        const successful = session.successful_extractions || 0;
        const dropped = totalUrls - processed;
        totalDropped += dropped;
        
        console.log(`Session ${session.id.substring(0, 8)}...`);
        console.log(`  Status: ${session.status}`);
        console.log(`  Total URLs: ${totalUrls}`);
        console.log(`  Processed: ${processed}`);
        console.log(`  Successful: ${successful}`);
        console.log(`  Dropped/Unprocessed: ${dropped}`);
        console.log(`  Success rate: ${processed > 0 ? ((successful/processed)*100).toFixed(1) : 0}%`);
        
        if (session.error_message) {
          console.log(`  Error: ${session.error_message}`);
        }
        console.log('');
      });
      
      console.log(`Total dropped URLs across sessions: ${totalDropped}\n`);
    } else {
      console.log('No extraction sessions found in database.\n');
    }
    
    // 2. Check activities for extraction patterns
    console.log('2. Analyzing extraction patterns in activities...');
    
    // Get a sample day's extractions
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const { data: recentActivities } = await supabase
      .from('activities')
      .select('*')
      .eq('action', 'extract_contact')
      .gte('timestamp', yesterday.toISOString())
      .order('timestamp', { ascending: false });
      
    if (recentActivities && recentActivities.length > 0) {
      const successCount = recentActivities.filter(a => a.success === true).length;
      const failCount = recentActivities.filter(a => a.success === false).length;
      
      console.log(`Last 24 hours: ${recentActivities.length} extraction attempts`);
      console.log(`  - Successful: ${successCount} (${(successCount/recentActivities.length*100).toFixed(1)}%)`);
      console.log(`  - Failed: ${failCount} (${(failCount/recentActivities.length*100).toFixed(1)}%)`);
      
      // Group failures by error type
      const failureReasons = {};
      recentActivities.filter(a => !a.success).forEach(a => {
        const reason = a.details || 'Unknown';
        failureReasons[reason] = (failureReasons[reason] || 0) + 1;
      });
      
      console.log('\nFailure reasons:');
      Object.entries(failureReasons).forEach(([reason, count]) => {
        console.log(`  - "${reason}": ${count} times`);
      });
    }
    
    // 3. Check for patterns in URLs that fail
    console.log('\n3. Checking for URL patterns in failures...');
    const { data: failedExtractions } = await supabase
      .from('activities')
      .select('linkedin_url, details')
      .eq('action', 'extract_contact')
      .eq('success', false)
      .not('linkedin_url', 'is', null)
      .limit(50);
      
    if (failedExtractions && failedExtractions.length > 0) {
      // Check for common patterns
      let salesNavCount = 0;
      let regularCount = 0;
      let otherCount = 0;
      
      failedExtractions.forEach(f => {
        if (f.linkedin_url.includes('sales.linkedin.com')) {
          salesNavCount++;
        } else if (f.linkedin_url.includes('linkedin.com/in/')) {
          regularCount++;
        } else {
          otherCount++;
        }
      });
      
      console.log('Failed URL types:');
      console.log(`  - Sales Navigator: ${salesNavCount}`);
      console.log(`  - Regular LinkedIn: ${regularCount}`);
      console.log(`  - Other: ${otherCount}`);
    }
    
    // 4. Check API key exhaustion patterns
    console.log('\n4. Looking for API key exhaustion patterns...');
    const { data: creditErrors } = await supabase
      .from('activities')
      .select('timestamp, details')
      .eq('action', 'extract_contact')
      .eq('success', false)
      .or('details.ilike.%credit%,details.ilike.%billing%,details.ilike.%Service temporarily unavailable%')
      .order('timestamp', { ascending: false })
      .limit(20);
      
    if (creditErrors && creditErrors.length > 0) {
      console.log(`Found ${creditErrors.length} credit/billing related failures:`);
      creditErrors.slice(0, 5).forEach(e => {
        console.log(`  - ${e.timestamp}: ${e.details}`);
      });
      
      // Check if they're clustered
      if (creditErrors.length >= 2) {
        const firstTime = new Date(creditErrors[creditErrors.length - 1].timestamp);
        const lastTime = new Date(creditErrors[0].timestamp);
        const timeDiff = (lastTime - firstTime) / 1000 / 60; // minutes
        console.log(`\nThese errors span ${timeDiff.toFixed(1)} minutes`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkTimeoutIssues();