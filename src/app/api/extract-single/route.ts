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
    const apiKey = apiKeyPool?.getNextKey();
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'No API keys available' },
        { status: 503 }
      );
    }
    
    console.log(`Server: Extracting ${url} with API key ${apiKey.substring(0, 10)}...`);
    
    // Check user credits if userId provided
    if (userId) {
      const hasCredits = await creditService.hasEnoughCredits(userId, 1);
      if (!hasCredits) {
        return NextResponse.json(
          { error: 'Insufficient credits' },
          { status: 402 }
        );
      }
    }
    
    // Extract contact using the selected API key
    const result = await extractContactWithWiza(url, apiKey);
    
    // Deduct credits if successful and userId provided
    if (result.success && result.contact && userId) {
      // Calculate credits based on what was found
      let creditsToDeduct = 0;
      if (result.contact.emails?.length || result.contact.phones?.length) {
        creditsToDeduct = 2; // 2 credits for successful extraction
      }
      
      if (creditsToDeduct > 0) {
        await creditService.deductCredits(userId, creditsToDeduct, 'single_extraction');
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
