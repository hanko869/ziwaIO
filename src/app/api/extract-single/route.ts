import { NextRequest, NextResponse } from 'next/server';
import { extractContactWithWiza } from '@/utils/wiza';
import { initializeApiKeys } from '@/utils/apiKeyLoader';
import { getApiKeyPool } from '@/utils/apiKeyPool';
import { creditService } from '@/lib/credits';
import { isValidLinkedInUrl } from '@/utils/extraction';

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
    
    // Deduct credits if successful and userId provided
    if (result.success && result.contact && userId) {
      // Calculate credits based on what was found
      // Our pricing: 1 credit per email, 2 credits per phone
      let creditsToDeduct = 0;
      const emailCount = result.contact.emails?.length || 0;
      const phoneCount = result.contact.phones?.length || 0;
      
      creditsToDeduct = (emailCount * 1) + (phoneCount * 2);
      
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
