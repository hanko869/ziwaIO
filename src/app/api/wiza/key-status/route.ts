import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/utils/auth';
import { getApiKeyPool } from '@/utils/apiKeyPool';
import { checkWizaCredits } from '@/utils/wiza';
import { loadApiKeys, initializeApiKeys } from '@/utils/apiKeyLoader';

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only allow admin users to check API key status
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Initialize API keys if not already done
    let apiKeyPool = getApiKeyPool();
    if (!apiKeyPool) {
      initializeApiKeys();
      apiKeyPool = getApiKeyPool();
    }

    if (!apiKeyPool) {
      return NextResponse.json(
        { error: 'Failed to initialize API key pool' },
        { status: 500 }
      );
    }

    // Get all keys
    const keys = loadApiKeys();
    const keyStatuses = [];

    // Check credits for each key
    for (const key of keys) {
      try {
        const credits = await checkWizaCredits(key);
        keyStatuses.push({
          key: key.substring(0, 10) + '...', // Show partial key for security
          available: credits?.credits?.api_credits > 0,
          credits: credits?.credits || null,
          error: null
        });

        // Update the pool with credit info
        apiKeyPool.updateKeyCredits(key, credits);
      } catch (error) {
        keyStatuses.push({
          key: key.substring(0, 10) + '...', 
          available: false,
          credits: null,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      totalKeys: keys.length,
      availableKeys: apiKeyPool.getAvailableKeysCount(),
      keyStatuses,
      poolStatus: apiKeyPool.getAllKeysStatus()
    });

  } catch (error) {
    console.error('Error checking API key status:', error);
    return NextResponse.json(
      { error: 'Failed to check API key status' },
      { status: 500 }
    );
  }
} 