import { NextRequest, NextResponse } from 'next/server';
import { loadApiKeys } from '@/utils/apiKeyLoader';

export async function GET(request: NextRequest) {
  try {
    // Load API keys on the server side where env vars are accessible
    const keys = loadApiKeys();
    
    // Don't send the actual keys to the client, just metadata
    const keyInfo = {
      count: keys.length,
      keys: keys.map((key, index) => ({
        id: index + 1,
        partial: key.substring(0, 10) + '...',
        available: true
      }))
    };
    
    console.log(`Server: Loaded ${keys.length} API keys`);
    keys.forEach((key, index) => {
      console.log(`  Key ${index + 1}: ${key.substring(0, 10)}...`);
    });
    
    return NextResponse.json({
      success: true,
      keyInfo,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error initializing API keys:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to initialize API keys' 
      },
      { status: 500 }
    );
  }
}
