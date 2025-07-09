import { NextRequest, NextResponse } from 'next/server';
import { extractContactWithWiza } from '@/utils/wiza';
import { creditService } from '@/lib/credits';

// Add GET handler for API configuration check
export async function GET(request: NextRequest) {
  const wizaApiKey = process.env.WIZA_API_KEY;
  
  if (wizaApiKey) {
    return NextResponse.json({
      status: 'ready',
      provider: 'Wiza API'
    });
  } else {
    return NextResponse.json({
      status: 'not_configured',
      provider: 'Wiza API'
    }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { linkedinUrl } = await request.json();

    if (!linkedinUrl) {
      return NextResponse.json(
        { error: 'LinkedIn URL is required' },
        { status: 400 }
      );
    }

    // Extract contact information
    const result = await extractContactWithWiza(linkedinUrl);

    if (result.success && result.contact) {
      // For subscription version, we would deduct credits here
      // For now, just return the result
      return NextResponse.json({
        success: true,
        contact: result.contact
      });
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to extract contact' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Extract API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 