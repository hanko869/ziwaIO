import { NextRequest, NextResponse } from 'next/server';
import { extractContactsInParallel } from '@/utils/parallelExtraction';
import { initializeApiKeys } from '@/utils/apiKeyLoader';
import { getApiKeyPool } from '@/utils/apiKeyPool';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { urls, userId } = await request.json();
    
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { error: 'URLs array is required' },
        { status: 400 }
      );
    }
    
    // Initialize API keys on server side where all env vars are accessible
    console.log('Initializing API keys from environment...');
    console.log('WIZA_API_KEY exists:', !!process.env.WIZA_API_KEY);
    console.log('WIZA_API_KEY_2 exists:', !!process.env.WIZA_API_KEY_2);
    console.log('WIZA_API_KEY_3 exists:', !!process.env.WIZA_API_KEY_3);
    
    initializeApiKeys();
    const apiKeyPool = getApiKeyPool();
    const availableKeys = apiKeyPool?.getAvailableKeysCount() || 1;
    
    console.log(`Server: Starting bulk extraction with ${availableKeys} API keys for ${urls.length} URLs`);
    
    // Process extraction with all available API keys
    const results = await extractContactsInParallel(urls, {
      maxConcurrent: availableKeys * 2, // Use 2x concurrency for better utilization
      delayBetweenBatches: 1000
    });
    
    // Count successful extractions and calculate credits
    let successCount = 0;
    let creditsUsed = 0;
    let totalEmails = 0;
    let totalPhones = 0;
    
    // Save contacts to database if userId provided
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    let supabase = null;
    
    if (supabaseUrl && supabaseKey && userId) {
      supabase = createClient(supabaseUrl, supabaseKey);
    }
    
    // Process results and save to database
    for (const result of results) {
      if (result.success && result.contact) {
        successCount++;
        // Our pricing: 1 credit per email, 2 credits per phone
        const emailCount = result.contact.emails?.length || 0;
        const phoneCount = result.contact.phones?.length || 0;
        totalEmails += emailCount;
        totalPhones += phoneCount;
        creditsUsed += (emailCount * 1) + (phoneCount * 2);
        
        // Save to database if we have supabase client and userId
        if (supabase && userId) {
          try {
            const { data: savedContact, error } = await supabase
              .from('extracted_contacts')
              .insert({
                user_id: userId,
                linkedin_url: result.contact.linkedinUrl,
                name: result.contact.name,
                emails: result.contact.emails || [],
                phones: result.contact.phones || [],
                job_title: result.contact.jobTitle,
                company: result.contact.company,
                location: result.contact.location,
                credits_used: (emailCount * 1) + (phoneCount * 2),
                extracted_at: new Date().toISOString()
              })
              .select()
              .single();
              
            if (error) {
              console.error('Error saving contact to database:', error);
            } else {
              console.log('Contact saved successfully:', savedContact?.id, savedContact?.name);
            }
          } catch (dbError) {
            console.error('Database save error:', dbError);
          }
        }
      }
    }
    
    // Deduct credits if userId provided
    if (userId && creditsUsed > 0) {
      try {
        // Import creditService
        const { creditService } = await import('@/lib/credits');
        await creditService.deductCredits(userId, creditsUsed, 'bulk_extraction');
        console.log(`Bulk extraction: Deducted ${creditsUsed} credits for ${totalEmails} email(s) x 1 + ${totalPhones} phone(s) x 2`);
      } catch (creditError) {
        console.error('Credit deduction error:', creditError);
        // Continue without deducting credits
      }
    }
    
    // Log final API key usage
    const finalKeyStats = apiKeyPool?.getAllKeysStatus();
    console.log('Server: Final API key usage:', finalKeyStats);
    
    return NextResponse.json({
      success: true,
      results,
      stats: {
        total: urls.length,
        successful: successCount,
        failed: urls.length - successCount,
        apiKeysUsed: availableKeys
      }
    });
    
  } catch (error) {
    console.error('Bulk extraction error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Extraction failed' 
      },
      { status: 500 }
    );
  }
}
