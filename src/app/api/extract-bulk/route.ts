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
      try {
        const hasCredits = await creditService.hasEnoughCredits(userId, urls.length);
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
    
    // Process extraction with all available API keys
    const results = await extractContactsInParallel(urls, {
      maxConcurrent: availableKeys * 3, // Increased to 3x for better throughput
      delayBetweenBatches: 0 // Removed delay for faster processing
    });
    
    // Count successful extractions and calculate credits
    let successCount = 0;
    let creditsUsed = 0;
    let totalEmails = 0;
    let totalPhones = 0;
    
    results.forEach((result, index) => {
      if (result.success && result.contact) {
        successCount++;
        // Our pricing: 1 credit per email, 2 credits per phone
        const emailCount = result.contact.emails?.length || 0;
        const phoneCount = result.contact.phones?.length || 0;
        totalEmails += emailCount;
        totalPhones += phoneCount;
        creditsUsed += (emailCount * 1) + (phoneCount * 2);
      }
    });
    
    // Deduct credits if userId provided
    if (userId && creditsUsed > 0) {
      try {
        await creditService.deductCredits(userId, creditsUsed, 'bulk_extraction');
        console.log(`Bulk extraction: Deducted ${creditsUsed} credits for ${totalEmails} email(s) x 1 + ${totalPhones} phone(s) x 2`);
      } catch (creditError) {
        console.error('Credit deduction error:', creditError);
        // Continue without deducting credits for now
      }
    } else if (creditsUsed === 0) {
      console.log('No credits deducted - no emails or phones found in bulk extraction');
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
