import { NextRequest, NextResponse } from 'next/server';
import { creditService } from '@/lib/credits';

export async function GET(request: NextRequest) {
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

    // Get user's credit balance
    const credits = await creditService.getUserCredits(userId);
    
    if (!credits) {
      // Initialize credits for new user
      const newCredits = await creditService.initializeUserCredits(userId);
      return NextResponse.json({
        balance: newCredits?.balance || 0,
        totalPurchased: newCredits?.totalPurchased || 0,
        totalUsed: newCredits?.totalUsed || 0
      });
    }

    return NextResponse.json({
      balance: credits.balance,
      totalPurchased: credits.totalPurchased,
      totalUsed: credits.totalUsed
    });
  } catch (error) {
    console.error('Get balance error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 