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
    console.log('Stats from getOverallStatistics:', stats);

    // Make sure we have valid numbers
    const response = {
      totalUsers: stats.totalUsers || 0,
      activeUsers: stats.activeUsers || 0,
      totalExtractions: stats.totalExtractions || 0,
      todayActivity: stats.todayActivityCount || 0,
      successRate: stats.successRate || '0',
      recentActivities: stats.recentActivities || []
    };
    
    console.log('Sending response:', response);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 