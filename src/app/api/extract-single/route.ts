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
    
    // Try extraction with available API keys until one succeeds
    let result: any = null;
    let lastError: string = '';
    let attemptCount = 0;
    let successfulApiKey: string | null = null;
    const maxAttempts = apiKeyPool?.getAllKeysStatus().length || 3;
    
    while (attemptCount < maxAttempts) {
      const apiKey = apiKeyPool?.getNextKey();
      
      if (!apiKey) {
        console.error('No more API keys available. Pool status:', apiKeyPool?.getAllKeysStatus());
        break;
      }
      
      console.log(`Server: Attempt ${attemptCount + 1}/${maxAttempts} - Extracting ${url} with API key ${apiKey.substring(0, 10)}...`);
      
      // Extract contact using the selected API key
      result = await extractContactWithWiza(url, apiKey);
      
      // If successful, break the loop
      if (result.success) {
        console.log(`Success with API key ${apiKey.substring(0, 10)}...`);
        successfulApiKey = apiKey;
        break;
      }
      
      // If failed due to billing/credits, mark as unavailable and try next
      if (result.error?.includes('credits') || result.error?.includes('billing') || result.error?.includes('Service temporarily unavailable')) {
        apiKeyPool?.markKeyUnavailable(apiKey);
        console.log(`API key ${apiKey.substring(0, 10)}... has billing/credit issues. Marked as unavailable.`);
        lastError = result.error;
        attemptCount++;
        continue;
      }
      
      // For other errors, just return the error
      console.log(`API key ${apiKey.substring(0, 10)}... failed with non-billing error: ${result.error}`);
      break;
    }
    
    // If no result or all attempts failed
    if (!result || !result.success) {
      return NextResponse.json(
        { 
          success: false,
          error: lastError || 'Service temporarily unavailable. Please try again later or contact support.',
          attemptsMade: attemptCount
        },
        { status: 503 }
      );
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
            .from('contacts')
            .insert({
              user_id: userId,
              linkedin_url: result.contact.linkedinUrl,
              name: result.contact.name,
              emails: [],
              phones: result.contact.phones || [],
              title: result.contact.jobTitle,
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
      apiKeyUsed: successfulApiKey ? successfulApiKey.substring(0, 10) + '...' : 'N/A'
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
