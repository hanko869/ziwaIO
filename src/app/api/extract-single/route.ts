import { NextRequest, NextResponse } from 'next/server';
import { extractContactWithWiza } from '@/utils/wiza';
import { initializeApiKeys } from '@/utils/apiKeyLoader';
import { getApiKeyPool } from '@/utils/apiKeyPool';
import { creditService } from '@/lib/credits';
import { isValidLinkedInUrl } from '@/utils/extraction';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { url, userId } = await request.json();
    
    if (!url) {
      return NextResponse.json(
        { error: 'LinkedIn URL is required' },
        { status: 400 }
      );
    }
    
    if (!isValidLinkedInUrl(url)) {
      return NextResponse.json(
        { error: 'Invalid LinkedIn URL format' },
        { status: 400 }
      );
    }
    
    // Initialize API keys on server side
    initializeApiKeys();
    const apiKeyPool = getApiKeyPool();
    
    // Debug: Log available keys
    console.log('API Key Pool status:', {
      initialized: !!apiKeyPool,
      availableKeys: apiKeyPool?.getAvailableKeysCount() || 0,
      allKeys: apiKeyPool?.getAllKeysStatus() || []
    });
    
    const apiKey = apiKeyPool?.getNextKey();
    
    if (!apiKey) {
      console.error('No API key available. Pool status:', apiKeyPool?.getAllKeysStatus());
      return NextResponse.json(
        { error: 'No API keys available' },
        { status: 503 }
      );
    }
    
    console.log(`Server: Extracting ${url} with API key ${apiKey.substring(0, 10)}...`);
    
    // Check user credits if userId provided
    if (userId) {
      try {
        const hasCredits = await creditService.hasEnoughCredits(userId, 1);
        if (!hasCredits) {
          return NextResponse.json(
            { error: 'Insufficient credits' },
            { status: 402 }
          );
        }
      } catch (creditError) {
        console.error('Credit check error:', creditError);
        // Continue without credit check for now
      }
    }
    
    // Extract contact using the selected API key
    const result = await extractContactWithWiza(url, apiKey);
    
    // Mark API key as unavailable if there's a billing/credits issue
    if (!result.success && (result.error?.includes('credits') || result.error?.includes('billing') || result.error?.includes('API credits issue'))) {
      apiKeyPool?.markKeyUnavailable(apiKey);
      console.log(`Marked API key ${apiKey.substring(0, 10)}... as unavailable due to: ${result.error}`);
    }
    
    // Save to database and deduct credits if successful and userId provided
    if (result.success && result.contact && userId) {
      // Calculate credits based on what was found (phone-only pricing)
      // Phone: 2 credits each. We no longer charge for email.
      let creditsToDeduct = 0;
      const emailCount = 0;
      const phoneCount = result.contact.phones?.length || 0;
      
      creditsToDeduct = phoneCount * 2;
      
      // Save to database
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
      
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        try {
          const { error } = await supabase
            .from('extracted_contacts')
            .insert({
              user_id: userId,
              linkedin_url: result.contact.linkedinUrl,
              name: result.contact.name,
              emails: [],
              phones: result.contact.phones || [],
              job_title: result.contact.jobTitle,
              company: result.contact.company,
              location: result.contact.location,
              credits_used: creditsToDeduct,
              extracted_at: new Date().toISOString()
            });
            
          if (error) {
            console.error('Error saving contact to database:', error);
          } else {
            console.log('Contact saved to database successfully');
          }
        } catch (dbError) {
          console.error('Database save error:', dbError);
        }
      }
      
      // Deduct credits
      if (creditsToDeduct > 0) {
        try {
          await creditService.deductCredits(userId, creditsToDeduct, 'single_extraction');
          console.log(`Deducted ${creditsToDeduct} credits: ${emailCount} email(s) x 1 + ${phoneCount} phone(s) x 2`);
        } catch (creditError) {
          console.error('Credit deduction error:', creditError);
          // Continue without deducting credits for now
        }
      } else {
        console.log('No credits deducted - no email or phone found');
      }
    }
    
    // Log API key usage
    const keyStats = apiKeyPool?.getAllKeysStatus();
    console.log('Server: API key usage after extraction:', keyStats);
    
    return NextResponse.json({
      success: result.success,
      contact: result.contact,
      error: result.error,
      apiKeyUsed: apiKey.substring(0, 10) + '...'
    });
    
  } catch (error) {
    console.error('Single extraction error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Extraction failed' 
      },
      { status: 500 }
    );
  }
}
