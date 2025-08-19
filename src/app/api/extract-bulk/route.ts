import { NextRequest, NextResponse } from 'next/server';
import { extractContactsInParallel } from '@/utils/parallelExtraction';
import { initializeApiKeys } from '@/utils/apiKeyLoader';
import { getApiKeyPool } from '@/utils/apiKeyPool';
import { creditService } from '@/lib/credits';

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
    initializeApiKeys();
    const apiKeyPool = getApiKeyPool();
    const availableKeys = apiKeyPool?.getAvailableKeysCount() || 1;
    
    console.log(`Server: Starting bulk extraction with ${availableKeys} API keys for ${urls.length} URLs`);
    
    // Check user credits if userId provided
    if (userId) {
      const hasCredits = await creditService.hasEnoughCredits(userId, urls.length);
      if (!hasCredits) {
        return NextResponse.json(
          { error: 'Insufficient credits' },
          { status: 402 }
        );
      }
    }
    
    // Process extraction with all available API keys
    const results = await extractContactsInParallel(urls, {
      maxConcurrent: availableKeys * 2, // Use 2x concurrency for better utilization
      delayBetweenBatches: 1000
    });
    
    // Count successful extractions
    let successCount = 0;
    let creditsUsed = 0;
    
    results.forEach((result, index) => {
      if (result.success && result.contact) {
        successCount++;
        // Calculate credits used (2 for email + phone)
        if (result.contact.emails?.length || result.contact.phones?.length) {
          creditsUsed += 2;
        }
      }
    });
    
    // Deduct credits if userId provided
    if (userId && creditsUsed > 0) {
      await creditService.deductCredits(userId, creditsUsed, 'bulk_extraction');
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
        creditsUsed,
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
