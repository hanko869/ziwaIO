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
    // Check authentication
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Decode token to get user ID
    let userId: string;
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      userId = payload.userId;
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    const { linkedinUrl } = await request.json();

    if (!linkedinUrl) {
      return NextResponse.json(
        { error: 'LinkedIn URL is required' },
        { status: 400 }
      );
    }

    // Check if user has credits
    const emailCount = 1; // Estimate 1 email
    const phoneCount = 0; // Estimate 0 phones
    const { totalCredits } = creditService.calculateCreditsForResults(emailCount, phoneCount);
    
    const hasCredits = await creditService.hasEnoughCredits(userId, totalCredits);
    if (!hasCredits) {
      return NextResponse.json(
        { error: 'Insufficient credits. Please deposit more credits.' },
        { status: 402 }
      );
    }

    // Extract contact information
    const result = await extractContactWithWiza(linkedinUrl);

    if (result.success && result.contact) {
      // Calculate actual credits based on results
      const actualEmailCount = result.contact.emails?.length || (result.contact.email ? 1 : 0);
      const actualPhoneCount = result.contact.phones?.length || (result.contact.phone ? 1 : 0);
      
      // Deduct credits
      const creditResult = await creditService.deductCreditsForResults(
        userId,
        actualEmailCount,
        actualPhoneCount,
        linkedinUrl
      );

      if (!creditResult.success) {
        return NextResponse.json(
          { error: 'Failed to deduct credits' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        contact: result.contact,
        creditsUsed: creditResult.creditsUsed
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