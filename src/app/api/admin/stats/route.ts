import { NextRequest, NextResponse } from 'next/server';
import { getOverallStatistics } from '@/utils/userDb';
import { creditService } from '@/lib/credits';

export async function GET(request: NextRequest) {
  try {
    // Check if user is admin (middleware should handle this)
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get statistics
    const stats = await getOverallStatistics();

    return NextResponse.json({
      totalUsers: stats.totalUsers,
      activeUsers: stats.activeUsers,
      totalExtractions: stats.totalExtractions,
      totalRevenue: stats.totalRevenue || 0, // Use actual revenue from credit_transactions
      todayActivity: stats.todayActivityCount,
      successRate: stats.successRate,
      recentActivities: stats.recentActivities
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 