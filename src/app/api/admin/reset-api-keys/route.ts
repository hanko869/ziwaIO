import { NextRequest, NextResponse } from 'next/server';
import { getApiKeyPool } from '@/utils/apiKeyPool';

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.includes('admin')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const apiKeyPool = getApiKeyPool();
    if (!apiKeyPool) {
      return NextResponse.json(
        { error: 'API key pool not initialized' },
        { status: 500 }
      );
    }
    
    // Reset all API keys availability
    apiKeyPool.resetAllKeysAvailability();
    
    // Get updated status
    const keyStatus = apiKeyPool.getAllKeysStatus();
    
    return NextResponse.json({
      success: true,
      message: 'All API keys have been reset',
      keyStatus
    });
    
  } catch (error) {
    console.error('Reset API keys error:', error);
    return NextResponse.json(
      { error: 'Failed to reset API keys' },
      { status: 500 }
    );
  }
}
